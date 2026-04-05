/**
 * Generate beautiful HTML email template for welcome emails
 */
interface WelcomeEmailData {
    name: string;
    email: string;
    password: string;
    role: "admin" | "student";
    rollNo?: string;
    loginUrl?: string;
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    const { name, email, password, role, rollNo, loginUrl = "http://localhost:3000/sign-in" } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to Algo-Grade</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .mobile-full-width { width: 100% !important; }
            .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .mobile-text-center { text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Preview Text (hidden) -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        Welcome to Algo-Grade! Your account has been created. Here are your login details.
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <!-- Main Container -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;" class="mobile-padding">
                <!-- Email Content -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 48px 40px; text-align: center;">
                            <!--[if gte mso 9]>
                            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:200px;">
                            <v:fill type="gradient" color="#667eea" color2="#764ba2" angle="135"/>
                            <v:textbox inset="0,0,0,0">
                            <![endif]-->
                            <div style="text-align: center;">
                                <!-- Logo -->
                                <div style="display: inline-block; width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin-bottom: 16px; line-height: 64px; text-align: center; font-size: 32px;">
                                    ✨
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    Algo-Grade
                                </h1>
                                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">
                                    Code Together
                                </p>
                            </div>
                            <!--[if gte mso 9]>
                            </v:textbox>
                            </v:rect>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 40px 40px 24px;" class="mobile-padding">
                            <h2 style="margin: 0 0 12px; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Welcome, ${name}! 👋
                            </h2>
                            <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Your account has been successfully created on <strong style="color: #1f2937;">Algo-Grade</strong>. 
                                You can now access the platform using the credentials below.
                            </p>
                        </td>
                    </tr>

                    <!-- Account Details Card -->
                    <tr>
                        <td style="padding: 0 40px 24px;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                                            📋 Your Account Details
                                        </h3>
                                        
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong style="color: #374151; display: inline-block; width: 100px;">Name:</strong>
                                                    <span style="color: #1f2937;">${name}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong style="color: #374151; display: inline-block; width: 100px;">Email:</strong>
                                                    <span style="color: #1f2937;">${email}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong style="color: #374151; display: inline-block; width: 100px;">Role:</strong>
                                                    <span style="display: inline-block; background-color: ${role === 'admin' ? '#8b5cf6' : '#3b82f6'}; color: #ffffff; padding: 2px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize;">
                                                        ${role}
                                                    </span>
                                                </td>
                                            </tr>
                                            ${rollNo ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong style="color: #374151; display: inline-block; width: 100px;">Roll No:</strong>
                                                    <span style="color: #1f2937; font-family: 'Consolas', 'Monaco', monospace; font-weight: 600;">${rollNo}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Password Box -->
                    <tr>
                        <td style="padding: 0 40px 24px;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="margin: 0 0 8px; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                            🔐 Temporary Password
                                        </p>
                                        <p style="margin: 0; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #78350f; letter-spacing: 1px; word-break: break-all;">
                                            ${password}
                                        </p>
                                        <p style="margin: 12px 0 0; color: #92400e; font-size: 13px;">
                                            ⚠️ Please change this password after your first login for security.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Login Instructions -->
                    <tr>
                        <td style="padding: 0 40px 24px;" class="mobile-padding">
                            <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                                🚀 How to Get Started
                            </h3>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 12px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="width: 28px; height: 28px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; font-weight: 600; font-size: 14px; padding-right: 12px;">
                                                    1
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    Click the button below to visit the login page
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="width: 28px; height: 28px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; font-weight: 600; font-size: 14px; padding-right: 12px;">
                                                    2
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    Enter your email and temporary password above
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="width: 28px; height: 28px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; font-weight: 600; font-size: 14px; padding-right: 12px;">
                                                    3
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    Change your password after first login (recommended)
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                        <table role="presentation" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width: 28px; height: 28px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; font-weight: 600; font-size: 14px; padding-right: 12px;">
                                                    4
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    Start exploring assignments and problems!
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 40px 40px;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; text-align: center;">
                                            ✨ Login to Algo-Grade
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background-color: #e5e7eb; line-height: 1px;">&nbsp;</div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #f9fafb;" class="mobile-padding">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                            🔒 <strong style="color: #374151;">Security Notice:</strong><br>
                                            This email contains sensitive information. Please keep it secure and change your password after first login.
                                        </p>
                                        <p style="margin: 0 0 12px; color: #9ca3af; font-size: 13px;">
                                            If you didn't expect this email, please contact your administrator immediately.
                                        </p>
                                        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
                                            © ${new Date().getFullYear()} Algo-Grade. Code Together.<br>
                                            This is an automated message, please do not reply to this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End Email Content -->
            </td>
        </tr>
    </table>
    <!-- End Main Container -->
</body>
</html>
    `.trim();
}
