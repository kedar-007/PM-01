const catalyst = require("zcatalyst-sdk-node");
const axios = require("axios");

const credentials = {
  USERConnector: {
    client_id: "1000.MHJNQ4L3G2NIO4EBXKT86POD1WAI9J",
    client_secret: "4aa4cf841974ca7892568d8efdcdb369cc91693658",
    auth_url: "https://accounts.zoho.in/oauth/v2/token",
    refresh_url: "https://accounts.zoho.in/oauth/v2/token",
    refresh_token: "1000.d2507f90edabedaa2878abe42587614d.525e86783f060293779e913993f1305b",
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
  const start = (page - 1) * 100;

  let accessToken;
  try {
    accessToken = await cache.get("USERConnector");
    if (!accessToken.cache_value) {
      console.log("Generating new access token...");
      const token = await catalystApp
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
      `https://api.catalyst.zoho.in/baas/v1/project/17682000000037195/project-user?start=${start}&end=100`,
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

    const targetUsers = users.filter(
      (user) => user.user_id === 17072000000037140
    );

    console.log("targetUsers", targetUsers);

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
        const emailData = {
          from_email: "catalystadmin@dsv360.ai",
          to_email: user.email_id,
          subject: "Reminder: Complete Your SKYi Customer Portal Registration",
          html_mode: true,
          content: `<!DOCTYPE html>
            <html style="background-color: #f0f8ff;">
              <body style="font-family: Arial, sans-serif; background-color: #f0f8ff; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 30px auto; background: #ffffff; padding: 20px 25px; border-radius: 8px; border: 1px solid #cce0ff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);">
                  <img src="https://fristinetech.com/wp-content/uploads/2023/11/Google-Ads-Logo.png" alt="Company Logo" style="max-width: 90px; margin-bottom: 15px;">
                  <h2 style="color: #003366;">Hi ${user.first_name} ${user.last_name},</h2>
                  <h3 style="color: #0073e6;">🎉 DSV 360 Portal is Now Live!</h3>
                  <p style="color: #333;">A <strong>new instance</strong> of the DSV 360 Portal is now live. Please begin logging your time entries on the updated portal from now on.</p>
                  <p style="text-align: center;"><a href="https://project.dsv360.ai" style="background-color: #e6f2ff; color: #0073e6; padding: 10px 18px; border-radius: 24px; font-weight: bold; text-decoration: none;">https://project.dsv360.ai</a></p>
                  <h4 style="color: #003366;">📋 Available Task Categories:</h4>
                  <ul style="color: #333;">
                    <li>Internal Meeting</li>
                    <li>External Meeting</li>
                    <li>Idle Time</li>
                    <li>Training Taken</li>
                  </ul>
                  <p style="color: #333;">Log your time under the appropriate category. Additional tasks can be added if required.</p>
                  <p style="color: #333;">For feedback or suggestions, reach out to us or submit them directly via the application.</p>
                  <hr style="border: 0; height: 1px; background: #cce0ff;" />
                  <p style="color: #555;">Thanks & Regards,<br><strong>Product Team</strong></p>
                  <p style="color: #888; font-size: 11px;">© 2025 DSV 360. All rights reserved.</p>
                </div>
              </body>
            </html>`,
        };

        // Uncomment this in production
        // await emailService.sendMail(emailData);

        console.log(`✅ Email sent to ${user.email_id}`);
        successCount++;
        record.status = "success";
        record.error = "No";
      } catch (err) {
        record.status = "failed";
        record.error = JSON.stringify(err);
        failureCount++;
        console.error(`❌ Failed to send email to ${user.email_id}: ${err}`);
      }

      recordsToInsert.push(record);
    }

    // Save analytics
    if (recordsToInsert.length > 0) {
      await mailAnalyticsTable.insertRows(recordsToInsert);
      console.log(`✅ Inserted ${recordsToInsert.length} analytics records for page ${page}`);
    }

    // Admin Report Email
    try {
      const adminEmailData = {
        from_email: "catalystadmin@dsv360.ai",
        to_email: "aman@dsvcorp.com.au",
        subject: `DSV 360 Email Sent Report - Page ${page}`,
        html_mode: true,
        content: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #eaf3fc; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cce0ff;">
                <h2 style="color: #003366;">📊 DSV 360 Email Report (Page ${page})</h2>
                <p>Total Users Processed: <strong>${recordsToInsert.length}</strong></p>
                <p style="color: green;">✅ Emails Sent Successfully: <strong>${successCount}</strong></p>
                <p style="color: red;">❌ Failed Emails: <strong>${failureCount}</strong></p>
                <hr />
                <p style="font-size: 12px; color: #888;">Generated: ${new Date().toLocaleString()}</p>
              </div>
            </body>
          </html>`,
      };

      await emailService.sendMail(adminEmailData);
      console.log(`========REPORT========`);
      console.log("Total Users Processed:", recordsToInsert.length);
      console.log(`✅ Emails Sent Successfully:`, successCount);
      console.log("❌ Failed Emails:", failureCount);
      console.log(`======================`);
    } catch (err) {
      console.error("❌ Error in sending admin report:", err);
    }

    // Schedule next page job
    await jobScheduling.JOB.submitJob({
      job_name: `Job_Page_${page + 1}`,
      jobpool_name: "sendingEmailJobPool",
      target_type: "Function",
      target_name: "sending_email",
      params: {
        page: page + 1,
      },
      job_config: {
        number_of_retries: 2,
        retry_interval: 900,
      },
    });

    console.log(`✅ Scheduled Job_Page_${page + 1}`);
  } catch (err) {
    console.error(`❌ Error processing page ${page}:`, err);
    return context.closeWithFailure();
  }

  return context.closeWithSuccess();
};
