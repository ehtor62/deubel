'use client';

import { useState, useEffect, useRef } from 'react';

export default function InterviewInterface2() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [useInnerHTML, setUseInnerHTML] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    console.log('🔧 Starting ElevenLabs widget initialization...');
    
    // Reset states
    setWidgetError(null);
    setWidgetLoaded(false);
    
    let widgetInstance: HTMLElement | null = null;
    let isDestroyed = false;
    
    function tryInnerHTMLFallback() {
      console.log('🔄 Trying innerHTML fallback method...');
      if (!widgetRef.current || isDestroyed) return;
      
      try {
        widgetRef.current.innerHTML = `
          <elevenlabs-convai agent-id="agent_6601k6t8307weyxbahv9p0qnyfr0" style="width: 100%; height: 100%; display: block; min-height: 350px; border: none; border-radius: 8px;"></elevenlabs-convai>
        `;
        setWidgetLoaded(true);
        console.log('✅ Fallback method applied');
      } catch (error) {
        console.error('❌ Fallback method failed:', error);
        setWidgetError('All widget loading methods failed');
      }
    }
    
    function createWidget() {
      if (isDestroyed) {
        console.log('🛑 Component destroyed, canceling widget creation');
        return;
      }
      
      try {
        console.log('🎤 Creating ElevenLabs widget...');
        console.log('📍 Widget ref current:', widgetRef.current);
        
        if (!widgetRef.current) {
          console.error('❌ Widget container ref is null');
          setWidgetError('Container not available');
          return;
        }
        
        // Check if the custom element is defined
        if (!customElements.get('elevenlabs-convai')) {
          console.log('⏳ Custom element not yet defined, waiting...');
          setTimeout(createWidget, 500);
          return;
        }
        
        // Clear existing content carefully
        if (widgetRef.current.firstChild) {
          try {
            widgetRef.current.innerHTML = '';
          } catch {
            console.log('⚠️ Error clearing container, continuing...');
          }
        }
        
        // Create the custom element
        const widget = document.createElement('elevenlabs-convai');
        widget.setAttribute('agent-id', 'agent_6601k6t8307weyxbahv9p0qnyfr0');
        
        // Style the widget
        widget.style.cssText = `
          width: 100%;
          height: 100%;
          display: block;
          min-height: 350px;
          border: none;
          border-radius: 8px;
        `;
        
        // Update container styling
        if (widgetRef.current) {
          widgetRef.current.style.cssText = 'background: transparent; border: none;';
          widgetRef.current.className = 'w-full h-full min-h-[350px]';
        }
        
        console.log('🎯 Widget element created:', widget);
        
        // Store reference before adding to DOM
        widgetInstance = widget;
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (isDestroyed || !widgetRef.current) return;
          
          try {
            widgetRef.current.appendChild(widget);
            console.log('✅ Widget added to container');
            
            if (!isDestroyed) {
              setWidgetLoaded(true);
            }
            
            // Verify widget persistence
            setTimeout(() => {
              if (isDestroyed) return;
              
              const addedWidget = widgetRef.current?.querySelector('elevenlabs-convai');
              console.log('🔍 Widget verification:', addedWidget);
              
              if (addedWidget && !isDestroyed) {
                console.log('✅ Widget successfully mounted and visible');
              } else if (!isDestroyed) {
                console.error('❌ Widget not found after creation, trying innerHTML fallback');
                setUseInnerHTML(true);
                tryInnerHTMLFallback();
              }
            }, 2000);
            
          } catch (error) {
            console.error('❌ Error appending widget:', error);
            if (!isDestroyed) {
              setWidgetError('Failed to mount widget');
            }
          }
        });
        
      } catch (error) {
        console.error('❌ Error creating widget:', error);
        if (!isDestroyed) {
          setWidgetError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
    
    // Load script and create widget
    const initializeWidget = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
      
      if (existingScript && scriptLoadedRef.current) {
        console.log('📝 Script already loaded, creating widget...');
        setTimeout(createWidget, 200);
        return;
      }
      
      if (existingScript) {
        console.log('📝 Script exists, waiting for confirmation...');
        existingScript.addEventListener('load', () => {
          scriptLoadedRef.current = true;
          setTimeout(createWidget, 500);
        });
        return;
      }
      
      // Create new script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('✅ ElevenLabs ConvAI script loaded successfully');
        scriptLoadedRef.current = true;
        setTimeout(createWidget, 1000);
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load ElevenLabs ConvAI script:', error);
        if (!isDestroyed) {
          setWidgetError('Failed to load ElevenLabs script');
        }
      };
      
      document.head.appendChild(script);
      console.log('📦 New ElevenLabs script added to document head');
    };
    
    initializeWidget();
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up widget...');
      isDestroyed = true;
      
      // Don't remove the widget element, let it persist
      // This prevents the removeChild error in production
      if (widgetInstance && widgetInstance.parentNode) {
        console.log('🎤 Preserving widget in DOM');
      }
    };
  }, []);




  const handleN8nFormClick = () => {
    setIsLoading(true);
    
    // Create a wrapper page that will handle the form and auto-close
    const formUrl = `https://n8n.srv980236.hstgr.cloud/form/2168ee16-0076-4bdb-9c8c-502f5facd164`;
    
    // Create wrapper HTML that embeds the form and handles auto-close
    const wrapperHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Interview Form</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    iframe { width: 100%; height: 100vh; border: none; }
    .success-message {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 1000;
      display: none;
    }
  </style>
</head>
<body>
  <div class="success-message" id="successMessage">
    Form submitted successfully! This tab will close in <span id="countdown">3</span> seconds...
  </div>
  <iframe src="${formUrl}" id="formFrame"></iframe>
  
  <script>
    // Listen for messages from the iframe (if n8n supports postMessage)
    window.addEventListener('message', function(event) {
      if (event.data && typeof event.data === 'string') {
        if (event.data.includes('submitted') || event.data.includes('success')) {
          showSuccessAndClose();
        }
      }
    });
    
    // Alternative: Monitor URL changes in iframe (limited by CORS)
    const iframe = document.getElementById('formFrame');
    
    // Fallback: Monitor for common success patterns
    let checkCount = 0;
    const maxChecks = 600; // 5 minutes
    
    const checkForSubmission = () => {
      checkCount++;
      if (checkCount > maxChecks) return;
      
      try {
        // This will likely fail due to CORS, but worth trying
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const bodyText = iframeDoc.body.textContent.toLowerCase();
        
        if (bodyText.includes('form submitted') || 
            bodyText.includes('thank you') || 
            bodyText.includes('success') ||
            bodyText.includes('submitted successfully')) {
          showSuccessAndClose();
          return;
        }
      } catch (e) {
        // CORS error - expected for external domains
      }
      
      setTimeout(checkForSubmission, 500);
    };
    
    function showSuccessAndClose() {
      const successDiv = document.getElementById('successMessage');
      const countdownSpan = document.getElementById('countdown');
      successDiv.style.display = 'block';
      
      let countdown = 3;
      const timer = setInterval(() => {
        countdown--;
        countdownSpan.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(timer);
          // Hide the success message before closing
          successDiv.style.display = 'none';
          // Close the window after a brief delay
          setTimeout(() => {
            window.close();
          }, 100);
        }
      }, 1000);
    }
    
    // Start monitoring after iframe loads
    iframe.onload = () => {
      setTimeout(checkForSubmission, 1000);
    };
    
    // Manual trigger for testing - remove in production
    window.triggerClose = showSuccessAndClose;
  </script>
</body>
</html>`;

    // Create blob URL and open in new tab
    const blob = new Blob([wrapperHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        AI Technical Interview Platform
      </h1>
      
      {/* Main Interview Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Start Your AI Interview</h2>
        
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Dein Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>

        {/* ElevenLabs ConvAI Widget */}
        <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🎤 AI Voice Interview</h3>
          <div className="min-h-[400px] bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div 
              ref={widgetRef} 
              className="w-full h-full min-h-[350px] bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center text-gray-600"
            >
              {!widgetLoaded && !widgetError && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="font-semibold">Loading AI Voice Interview Widget...</p>
                  <p className="text-sm text-gray-500 mt-1">Initializing ElevenLabs ConvAI</p>
                </div>
              )}
              {widgetError && (
                <div className="text-center text-red-600">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="font-semibold">Widget Load Error</p>
                  <p className="text-sm mt-1">{widgetError}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              )}
              {widgetLoaded && !useInnerHTML && !widgetRef.current?.querySelector('elevenlabs-convai') && (
                <div className="text-center text-green-600">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-semibold">Widget Loaded Successfully!</p>
                  <p className="text-sm">If you do not see the interface, try refreshing the page</p>
                </div>
              )}
              {useInnerHTML && (
                <div 
                  dangerouslySetInnerHTML={{
                    __html: '<elevenlabs-convai agent-id="agent_6601k6t8307weyxbahv9p0qnyfr0" style="width: 100%; height: 100%; display: block; min-height: 350px; border: none; border-radius: 8px;"></elevenlabs-convai>'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* N8n Form Button */}
        <div className="text-center">
          <button
            onClick={handleN8nFormClick}
            disabled={!name.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Opening Form...
              </div>
            ) : (
              'Lade Datei hoch'
            )}
          </button>
          
          {!name.trim() && (
            <p className="text-sm text-gray-500 mt-2">
              Please enter your name to continue
            </p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Interview Process
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Enter your name above</li>
          <li>Click &quot;Open Interview Form&quot; to proceed</li>
          <li>The interview form will open in a new tab</li>
          <li>Complete the form in the new tab</li>
          <li>After submission, the form tab will automatically close in 3 seconds</li>
        </ul>
      </div>

      {/* Footer Information */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This will open the interview form in a new tab. After you submit the form, that tab will automatically close. Make sure your browser allows pop-ups.
        </p>
      </div>
    </div>
  );
}
