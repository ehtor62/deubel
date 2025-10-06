// app/api/start-interview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseResume, formatResumeForAI } from '@/app/lib/resumeParser';

export async function POST(request: NextRequest) {
  try {
    const { fileId, candidateName } = await request.json();
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Find the uploaded file
    const uploadDir = path.join(process.cwd(), 'uploads');
    const files = await fs.readdir(uploadDir);
    const resumeFile = files.find(f => f.startsWith(fileId));
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    const filepath = path.join(uploadDir, resumeFile);
    
    // Parse resume content
    const resumeText = await parseResume(filepath);
    const formattedContext = formatResumeForAI(resumeText, candidateName);

    // Get signed URL from ElevenLabs for WebSocket connection
    console.log('Getting signed URL for agent:', process.env.ELEVENLABS_AGENT_ID);
    console.log('Resume context length:', formattedContext.length);
    
    // First, get a signed URL for the WebSocket connection (must use GET method)
    const signedUrlResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!signedUrlResponse.ok) {
      const error = await signedUrlResponse.text();
      console.error('ElevenLabs signed URL error:', error);
      console.error('Status:', signedUrlResponse.status);
      console.error('Agent ID:', process.env.ELEVENLABS_AGENT_ID);
      
      // Check if it's a permission error and provide helpful message
      if (signedUrlResponse.status === 401) {
        console.log('API key lacks convai_write permission, falling back to mock mode');
        
        // Fall back to mock mode for demo purposes
        const mockResponse = {
          conversation_id: `mock_conversation_${Date.now()}`,
          signed_url: `wss://api.elevenlabs.io/v1/convai/conversation/mock_conversation_${Date.now()}`,
          status: 'mock_fallback'
        };
        
        return NextResponse.json({
          success: true,
          conversationId: mockResponse.conversation_id,
          signedUrl: mockResponse.signed_url,
          isMock: true,
          message: 'Using demo mode - API key needs convai_write permission for full functionality'
        });
      }
      
      return NextResponse.json(
        { error: `Failed to get ElevenLabs signed URL: ${signedUrlResponse.status} - ${error}` },
        { status: 500 }
      );
    }

    const signedUrlData = await signedUrlResponse.json();
    console.log('Got signed URL successfully');

    // Generate a conversation ID for tracking
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      success: true,
      conversationId: conversationId,
      signedUrl: signedUrlData.signed_url,
      agentId: process.env.ELEVENLABS_AGENT_ID,
      resumeContext: formattedContext, // Full context for the frontend to use
      candidateName: candidateName,
    });


  } catch (error) {
    console.error('Start interview error:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}