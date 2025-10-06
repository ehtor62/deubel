// app/api/upload-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc (legacy)
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

/**
 * POST /api/upload-resume
 * Handles resume file uploads with validation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;
    
    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No file uploaded. Please select a resume file.' 
        },
        { status: 400 }
      );
    }

    // Validate file is actually a File object
    if (!(file instanceof File)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file format' 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'File is empty. Please upload a valid resume.' 
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false,
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB. Please upload a smaller file.` 
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file type. Only PDF and DOCX files are allowed.' 
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file extension. Only .pdf, .docx, and .doc files are allowed.' 
        },
        { status: 400 }
      );
    }

    // Validate filename length
    if (file.name.length > 255) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Filename is too long. Please rename the file.' 
        },
        { status: 400 }
      );
    }

    // Generate unique file ID and sanitized filename
    const fileId = uuidv4();
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const uniqueFilename = `${fileId}${fileExtension}`;
    
    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error. Please try again later.' 
        },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Additional validation: Check for empty or corrupted files
    if (buffer.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'File appears to be empty or corrupted.' 
        },
        { status: 400 }
      );
    }

    // Save file to disk
    const filepath = path.join(uploadDir, uniqueFilename);
    
    try {
      await writeFile(filepath, buffer);
    } catch (error) {
      console.error('Failed to write file:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save file. Please try again.' 
        },
        { status: 500 }
      );
    }

    // Log successful upload
    console.log(`Resume uploaded successfully: ${fileId} (${sanitizedOriginalName})`);

    // Return success response
    return NextResponse.json({
      success: true,
      fileId,
      filename: sanitizedOriginalName,
      filepath: uniqueFilename,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Handle file size errors from Next.js
      if (error.message.includes('body size')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'File is too large. Maximum size is 10MB.' 
          },
          { status: 413 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred during upload. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload-resume
 * Returns upload information (optional endpoint)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload-resume',
    method: 'POST',
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    allowedTypes: ['PDF', 'DOCX', 'DOC'],
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS
  });
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  return filename
    // Remove directory traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove special characters but keep spaces, dots, and common chars
    .replace(/[^a-zA-Z0-9\s._-]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, 200);
}

/**
 * Optional: Configure route segment options
 */
export const runtime = 'nodejs'; // 'nodejs' (default) | 'edge'
export const dynamic = 'force-dynamic'; // Disable caching for this route

