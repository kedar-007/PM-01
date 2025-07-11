const sendEmail = async (catalystApp, userDetail,template) => { 
    try {
        const emailService = catalystApp.email();
        const emailData = {
            from_email: "catalystadmin@dsv360.ai",
            to_email: userDetail.email_id,
            subject: "Notification from DSV 360",
            html_mode: true,
            content: template,
        }
        
        const response = await emailService.sendMail(emailData);
        console.log("Email sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = { sendEmail };
