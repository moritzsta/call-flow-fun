-- Insert sales email template
INSERT INTO email_templates (enum_name, title, subject_template, body_template)
VALUES (
  'sales',
  'Sales',
  'Antwort auf Ihre Anfrage',
  '<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antwort auf Ihre Anfrage</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <p>{{greeting}}</p>
        
        <p>vielen Dank für Ihre Anfrage bezüglich {{product_description}}. Wir freuen uns, Ihnen mitteilen zu können, dass unsere Lösung genau die Anforderungen erfüllt, die Sie an eine moderne, einfach zu implementierende und benutzerfreundliche Software stellen.</p>

        <p><strong>Warum unsere Lösung perfekt für Ihr Unternehmen ist:</strong></p>
        <ul>
            <li>Nahtlose Integration in Ihre bestehenden Systeme – keine Umstellung nötig.</li>
            <li>Automatisiert Ihre Prozesse effizient, was Ihre internen Abläufe enorm beschleunigt und Kosten spart.</li>
            <li>Benutzerfreundlich und einfach in der Bedienung, ohne dass Ihre Mitarbeiter zusätzliche Schulungen benötigen.</li>
            <li>Skalierbar, sodass Sie mit uns wachsen können, ganz nach Ihren Bedürfnissen.</li>
        </ul>

        <p>{{pitch_content}}</p>

        <p>Gerne möchten wir Ihnen die Software in einer persönlichen Demo vorstellen und gemeinsam besprechen, wie wir Ihre Automatisierungsziele umsetzen können. Wie wäre es mit einem unverbindlichen Termin? Wir sind flexibel und richten uns nach Ihrem Zeitplan.</p>

        <p>Ich freue mich auf Ihre Rückmeldung und darauf, Sie bald persönlich kennenzulernen.</p>

        <p>Mit freundlichen Grüßen,<br>
        {{seller_name}}<br><br>
        {{seller_company}}<br>
        {{seller_address}}<br>
        {{seller_phone}}<br>
        🌐 {{seller_website}}</p>
    </div>
</body>
</html>'
);