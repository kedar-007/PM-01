const catalyst = require("zcatalyst-sdk-node");
const axios = require("axios");

const credentials = {
  USERConnector: {
    client_id: "1000.MHJNQ4L3G2NIO4EBXKT86POD1WAI9J",
    client_secret: "4aa4cf841974ca7892568d8efdcdb369cc91693658",
    auth_url: "https://accounts.zoho.in/oauth/v2/token",
    refresh_url: "https://accounts.zoho.in/oauth/v2/token",
    refresh_token:
      "1000.d2507f90edabedaa2878abe42587614d.525e86783f060293779e913993f1305b",
  },
};

module.exports = async (event, context) => {
  const catalystApp = catalyst.initialize(context);
  const emailService = catalystApp.email();
  const cache = catalystApp.cache().segment();
  const jobScheduling = catalystApp.jobScheduling();
  const datastore = catalystApp.datastore();
  const mailAnalyticsTable = datastore.table("Mail_Analytics");

  const page = Number(event.getJobParam("page")) || 1;
  const start = (page - 1) * 50;

  let accessToken;
  try {
    accessToken = await cache.get("USERConnector");
    if (!accessToken.cache_value) {
      console.log("Generating new access token...");
      token = await catalystApp
        .connection(credentials)
        .getConnector("USERConnector")
        .getAccessToken();

      accessToken = { access_token: token };
      await cache.put("USERConnector", token, 1);
    } else {
      accessToken = { access_token: accessToken.cache_value };
    }
  } catch (error) {
    console.error("❌ Access token error:", error);
    return context.closeWithFailure();
  }

  try {
    const response = await axios.get(
      `https://api.catalyst.zoho.in/baas/v1/project/17682000000037195/project-user?start=${start}&end=50`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken.access_token}`,
          Environment: "Production",
        },
      }
    );

    const users = Array.isArray(response.data.data) ? response.data.data : [];

    if (users.length === 0) {
      console.log(`✅ No more users found at page ${page}. Stopping...`);
      return context.closeWithSuccess();
    }

    const targetUsers = users.filter((user) => user.is_confirmed === false);

    const recordsToInsert = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of targetUsers) {
      console.log("📧 Sending email to:", user.email_id);

      const record = {
        email_id: user.email_id,
        page_number: page,
        time_stamp: new Date().toISOString(),
      };

      try {
//         const emailData = {
//           from_email: "catalystadmin@dsv360.ai", // Ensure this is verified
//           to_email: user.email_id,
//           subject: "Reminder: Complete Your SKYi Customer Portal Registration",
//           html_mode: true,
//           content: `
//                      <html style="background-color: #f0f8ff;">
//   <body style="font-family: Arial, sans-serif; background-color: #f0f8ff; margin: 0; padding: 0;">
//     <div style="max-width: 600px; margin: 40px auto; background: #ffffff; padding: 20px; border-radius: 8px; text-align: left; border: 1px solid #cce0ff;">
//       <img src="https://fristinetech.com/wp-content/uploads/2023/11/Google-Ads-Logo.png" alt="Company Logo" style="max-width: 120px; margin-bottom: 20px;">
//       <h2 style="color: #003366;">Hello, ${user.first_name} ${user.last_name}</h2>
//       <h3 style="color: #0073e6;">Friendly Reminder: Complete Your DSV 360 Registration</h3>
//       <p style="color: #333;">We noticed that you haven't yet accepted your invitation to join the <strong>DSV 360</strong>.</p>
//       <p style="color: #333;">Please refer to the <strong>previous email</strong> we sent. It has your personalized link to complete the account setup.</p>
//       <p style="color: #333;">Still need help? Contact our support team.</p>
//       <p style="color: #555; font-size: 14px;">Thank you,</p>
//       <p style="color: #555; font-size: 14px;"><strong>DSV 360</strong> Team</p>
//       <hr style="border: 0; height: 1px; background: #cce0ff; margin: 20px 0;">
//       <p style="color: #888; font-size: 12px;">© 2025 DSV 360. All rights reserved.</p>
//     </div>
//   </body>
// </html>


//                     `,
//         };
//         await emailService.sendMail(emailData);

        const reinviteData = {
          platform_type: "web",
          redirect_url:
            "https://project.dsv360.ai/",
          user_details: {
            senders_mail:"catalystadmin@dsv360.ai",
            email_id: user.email_id,
            first_name: user.first_name,
            last_name: user.last_name,
          },
          template_details: {
            subject: "Reminder: Complete Your DSV 360 Customer Portal Registration",
            message: "<html style=\"background-color: #f0f8ff;\">\
  <body style=\"font-family: Arial, sans-serif; background-color: #f0f8ff; margin: 0; padding: 0;\">\
    <div style=\"max-width: 600px; margin: 40px auto; background: #ffffff; padding: 20px; border-radius: 8px; text-align: left; border: 1px solid #cce0ff;\">\
      <img src=\"https://fristinetech.com/wp-content/uploads/2023/11/Google-Ads-Logo.png\" alt=\"Company Logo\" style=\"max-width: 120px; margin-bottom: 20px;\">\
      <h2 style=\"color: #003366;\">Hello, ${user.first_name} ${user.last_name}</h2>\
      <h3 style=\"color: #0073e6;\">Friendly Reminder: Complete Your DSV 360 Registration</h3>\
      <p style=\"color: #333;\">We noticed that you haven't yet accepted your invitation to join the <strong>DSV 360</strong>.</p>\
      <p style=\"color: #333;\">To get started, please click the button below to complete your account setup:</p>\
      <a href=\"%LINK%\"\
         style=\"display: inline-block; padding: 14px 28px; background-color: #0073e6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0; transition: background-color 0.3s ease;\">\
         Accept Invitation\
      </a>\
      <p style=\"color: #333; font-size: 16px; margin-top: 20px;\">\
        Already registered? \
        <a href=\"https://portal.dsvcorp.com/\"\
           style=\"color: #0073e6; text-decoration: none; font-weight: bold;\">Click here to log into the portal</a>.\
      </p>\
      <p style=\"color: #333;\">Still need help? Contact our support team.</p>\
      <p style=\"color: #555; font-size: 14px;\">Thank you,</p>\
      <p style=\"color: #555; font-size: 14px;\"><strong>DSV 360</strong> Team</p>\
      <hr style=\"border: 0; height: 1px; background: #cce0ff; margin: 20px 0;\">\
      <p style=\"color: #888; font-size: 12px;\">© 2025 DSV 360. All rights reserved.</p>\
    </div>\
  </body>\
</html>",
          },
        };

        await axios.post(
          "https://api.catalyst.zoho.in/baas/v1/project/17682000000037195/project-user/re-invite",
          reinviteData,{
            headers: {
              "catalyst-org": "60040289923",
              "content-type": "application/json",
              environment: "Production",
              Authorization: `Zoho-oauthtoken ${accessToken.access_token}`,
            },
          }
        );

        console.log(`✅ Email sent to ${user.email_id}`);
        successCount++;
        record.status = "success";
        record.error = "No";
      } catch (err) {
        record.status = "false";
        record.error = JSON.stringify(err);
        failureCount++;
        console.error(`❌ Failed to send email to ${user.email_id}: ${err}`);
      }

      recordsToInsert.push(record);
    }

    //save analytics..
    if (recordsToInsert.length > 0) {
      await mailAnalyticsTable.insertRows(recordsToInsert);
      console.log(
        `✅ Inserted ${recordsToInsert.length} analytics records for page ${page}`
      );

      try {
        const adminEmailData = {
          from_email: "catalystadmin@dsv360.ai", // Updated email domain (optional)
          to_email: "aman@dsvcorp.com.au",
          subject: `DSV 360 Reminder Email Sent Report - Page ${page}`,
          html_mode: true,
          content: `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #eaf3fc; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cce0ff;">
          <h2 style="color: #003366;">📊 DSV 360 Email Report (Page ${page})</h2>
          <p style="color: #333;">Total Users Processed: <strong>${
            recordsToInsert.length
          }</strong></p>
          <p style="color: green;">✅ Emails Sent Successfully: <strong>${successCount}</strong></p>
          <p style="color: red;">❌ Failed Emails: <strong>${failureCount}</strong></p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #cce0ff;" />
          <p style="font-size: 12px; color: #888;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `,
        };

        await emailService.sendMail(adminEmailData);
        console.log(`========REPORT========`);
        console.log("Total Users Processed:", recordsToInsert.length);
        console.log(`✅ Emails Sent Successfully: `, successCount);
        console.log("❌ Failed Emails:", failureCount);
        console.log(`======================`);
      } catch (err) {
        console.error("❌ Error in adding analytics:", err);
      }
    }

    // 🔁 Schedule next page job
    await jobScheduling.JOB.submitJob({
      job_name: `Job_Page_${page + 1}`,
      jobpool_name: "weeklyRemainderJobPool",
      target_type: "Function",
      target_name: "send_remainder_function",
      params: {
        page: page + 1,
      },

      job_config: {
        number_of_retries: 2,
        retry_interval: 900,
      }, // set job config - job retries => 2 retries in 15 mins (optional)
    });

    console.log(`✅ Scheduled Job_Page_${page + 1}`);
  } catch (err) {
    console.error(`❌ Error processing page ${page}: ${err}`);
    return context.closeWithFailure();
  }

  return context.closeWithSuccess();
};
