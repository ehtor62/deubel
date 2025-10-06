// lib/resumeParser.ts
import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

// Type for pdf-parse function
type PdfParseFunction = (dataBuffer: Buffer, options?: unknown) => Promise<{ text: string; numpages: number; info: unknown; metadata: unknown; version: string }>;

/**
 * Interface for parsed resume data
 */
export interface ParsedResume {
  rawText: string;
  wordCount: number;
  hasContent: boolean;
}

/**
 * Main function to parse resume from file path
 * Supports PDF and DOCX formats
 */
export async function parseResume(filepath: string): Promise<string> {
  const fileExtension = path.extname(filepath).toLowerCase();
  
  try {
    let text: string;
    
    if (fileExtension === '.pdf') {
      text = await parsePDF(filepath);
    } else if (fileExtension === '.docx') {
      text = await parseDOCX(filepath);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}. Only PDF and DOCX are supported.`);
    }

    // Clean and validate the extracted text
    const cleanedText = cleanText(text);
    
    if (!cleanedText || cleanedText.trim().length < 50) {
      throw new Error('Resume appears to be empty or too short. Please upload a valid resume.');
    }

    return cleanedText;
  } catch (error) {
    console.error('Resume parsing error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to parse resume. Please ensure the file is not corrupted.');
  }
}

/**
 * Parse PDF files using pdf-parse
 */
async function parsePDF(filepath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filepath);
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule as unknown as PdfParseFunction;
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text. It may be an image-based PDF.');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
  }
}

/**
 * Parse DOCX files using mammoth
 */
async function parseDOCX(filepath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filepath);
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX contains no extractable text.');
    }
    
    // Log any conversion warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX conversion warnings:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. The file may be corrupted or in an unsupported format.');
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple line breaks (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim();
}

/**
 * Format resume content for AI interviewer with context
 */
export function formatResumeForAI(rawText: string, candidateName?: string): string {
  const sections = extractResumeSections(rawText);
  
  let formattedPrompt = `You are conducting a professional job interview. Below is the candidate's resume information.\n\n`;
  
  if (candidateName) {
    formattedPrompt += `CANDIDATE NAME: ${candidateName}\n\n`;
  }
  
  formattedPrompt += `RESUME CONTENT:\n${rawText}\n\n`;
  
  formattedPrompt += `---\n\nINTERVIEW INSTRUCTIONS:\n`;
  formattedPrompt += `- Conduct a professional and thorough job interview\n`;
  formattedPrompt += `- Ask relevant questions about their experience, skills, and projects mentioned in the resume\n`;
  formattedPrompt += `- Probe deeper into specific accomplishments and responsibilities\n`;
  formattedPrompt += `- Ask behavioral questions related to their background\n`;
  formattedPrompt += `- Assess their problem-solving abilities and technical knowledge\n`;
  formattedPrompt += `- Maintain a friendly but professional tone\n`;
  formattedPrompt += `- Listen carefully to their answers and ask follow-up questions\n`;
  formattedPrompt += `- Be encouraging and help the candidate feel comfortable\n\n`;
  
  if (sections.skills.length > 0) {
    formattedPrompt += `Key skills to explore: ${sections.skills.slice(0, 5).join(', ')}\n`;
  }
  
  if (sections.experience.length > 0) {
    formattedPrompt += `Focus areas: ${sections.experience.slice(0, 3).join(', ')}\n`;
  }
  
  return formattedPrompt.trim();
}

/**
 * Extract key sections from resume text
 * This is a simple heuristic-based extraction
 */
function extractResumeSections(text: string): {
  skills: string[];
  experience: string[];
  education: string[];
} {
  const sections = {
    skills: [] as string[],
    experience: [] as string[],
    education: [] as string[]
  };

  // Common skill keywords to look for
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Git', 'Agile',
    'Machine Learning', 'Data Analysis', 'Project Management', 'Leadership'
  ];

  // Extract skills mentioned in the resume
  skillKeywords.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      sections.skills.push(skill);
    }
  });

  // Look for experience-related keywords
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /worked\s+(?:as|at|with)\s+([^.,\n]+)/gi,
    /developed\s+([^.,\n]+)/gi,
    /managed\s+([^.,\n]+)/gi,
    /led\s+([^.,\n]+)/gi
  ];

  experiencePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 3 && match[1].trim().length < 100) {
        sections.experience.push(match[1].trim());
      }
    }
  });

  // Look for education keywords
  const educationKeywords = [
    'Bachelor', 'Master', 'PhD', 'Degree', 'University', 'College',
    'Computer Science', 'Engineering', 'Business Administration'
  ];

  educationKeywords.forEach(edu => {
    if (text.toLowerCase().includes(edu.toLowerCase())) {
      sections.education.push(edu);
    }
  });

  return sections;
}

/**
 * Validate resume file before parsing
 */
export async function validateResumeFile(filepath: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Check if file exists
    await fs.access(filepath);
    
    // Check file size (max 10MB)
    const stats = await fs.stat(filepath);
    if (stats.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Check file extension
    const ext = path.extname(filepath).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      return { valid: false, error: 'Only PDF and DOCX files are supported' };
    }
    
    return { valid: true };
  } catch (error: unknown) {
    console.error('File validation error:', error);
    return { valid: false, error: 'File not found or inaccessible' };
  }
}

/**
 * Get detailed information about parsed resume
 */
export function getResumeMetadata(text: string): ParsedResume {
  const cleanedText = cleanText(text);
  const wordCount = cleanedText.split(/\s+/).length;
  
  return {
    rawText: cleanedText,
    wordCount,
    hasContent: wordCount >= 50
  };
}

/**
 * Sanitize resume text for safe display/storage
 */
export function sanitizeResumeText(text: string): string {
  return text
    // Remove potential script tags or HTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Remove potentially malicious characters
    .replace(/[^\w\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>\/\n]/g, '')
    .trim();
}

/**
 * Extract contact information from resume (basic patterns)
 */
export function extractContactInfo(text: string): {
  emails: string[];
  phones: string[];
  linkedin?: string;
} {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinPattern = /linkedin\.com\/in\/[\w-]+/gi;
  
  const emails = text.match(emailPattern) || [];
  const phones = text.match(phonePattern) || [];
  const linkedinMatch = text.match(linkedinPattern);
  
  return {
    emails: Array.from(new Set(emails)),
    phones: Array.from(new Set(phones)),
    linkedin: linkedinMatch ? linkedinMatch[0] : undefined
  };
}