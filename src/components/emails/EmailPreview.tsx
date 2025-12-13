import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface EmailPreviewProps {
  subject: string;
  body: string;
  recipientEmail: string;
}

export const EmailPreview = ({ subject, body, recipientEmail }: EmailPreviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          E-Mail Vorschau
        </CardTitle>
        <CardDescription>So wird die E-Mail beim Empfänger angezeigt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Header */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">An:</span>
            <span className="text-sm">{recipientEmail}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Betreff:</span>
            <span className="text-sm font-medium">{subject}</span>
          </div>
        </div>

        {/* Email Body Preview */}
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-800">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      line-height: 1.6;
                      color: #1f2937;
                      background-color: #ffffff;
                      max-width: 600px;
                      margin: 0;
                      padding: 20px;
                    }
                    p { margin: 0 0 1em 0; }
                    a { color: #2563eb; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                  </style>
                </head>
                <body>
                  ${body}
                </body>
              </html>
            `}
            title="Email Preview"
            className="w-full min-h-[400px] border-0 rounded"
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  );
};
