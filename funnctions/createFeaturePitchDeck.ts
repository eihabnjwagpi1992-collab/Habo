import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Slides access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

    // Create new presentation
    const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Tsmart GSM - New Features Pitch Deck',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create presentation');
    }

    const presentation = await createResponse.json();
    const presentationId = presentation.presentationId;

    // Prepare slide content
    const slides = [
      {
        title: 'Tsmart GSM',
        subtitle: 'New Features Pitch Deck',
      },
      {
        title: 'Feature 1: Enhanced Order Tracking',
        subtitle: 'Real-time order status updates with email notifications',
      },
      {
        title: 'Feature 2: Advanced Analytics Dashboard',
        subtitle: 'Comprehensive insights into sales, revenue, and user behavior',
      },
      {
        title: 'Feature 3: Multi-Currency Support',
        subtitle: 'Support for multiple payment currencies and automatic conversion',
      },
      {
        title: 'Feature 4: API Integration Hub',
        subtitle: 'Easy integration with external providers and services',
      },
      {
        title: 'Impact & Timeline',
        subtitle: '📈 Expected 40% increase in user engagement\n⏰ Rollout: Q1 2026',
      },
      {
        title: 'Thank You',
        subtitle: 'Questions?',
      },
    ];

    // Build requests to add slides
    const requests = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideIndex = i;

      requests.push({
        addSlide: {
          objectId: `slide_${slideIndex}`,
          insertIndex: slideIndex,
          slideLayout: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      });

      requests.push({
        insertText: {
          objectId: `title_${slideIndex}`,
          text: slide.title,
        },
      });

      requests.push({
        insertText: {
          objectId: `subtitle_${slideIndex}`,
          text: slide.subtitle,
        },
      });
    }

    // Update text elements with formatting
    const updateRequests = [];

    for (let i = 0; i < slides.length; i++) {
      updateRequests.push({
        updateTextStyle: {
          objectId: `title_${i}`,
          fields: 'fontSize,bold,foregroundColor',
          style: {
            fontSize: { magnitude: 44, unit: 'PT' },
            bold: true,
            foregroundColor: {
              opaqueColor: {
                rgbColor: { red: 0, green: 0.831, blue: 1 }, // Cyan
              },
            },
          },
          textRange: { type: 'ALL' },
        },
      });

      updateRequests.push({
        updateTextStyle: {
          objectId: `subtitle_${i}`,
          fields: 'fontSize',
          style: {
            fontSize: { magnitude: 24, unit: 'PT' },
          },
          textRange: { type: 'ALL' },
        },
      });
    }

    // Execute all requests
    const batchUpdateResponse = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: [...requests, ...updateRequests] }),
      }
    );

    if (!batchUpdateResponse.ok) {
      throw new Error('Failed to update presentation');
    }

    return Response.json({
      success: true,
      presentationId,
      presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    });
  } catch (error) {
    console.error('Error creating pitch deck:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});