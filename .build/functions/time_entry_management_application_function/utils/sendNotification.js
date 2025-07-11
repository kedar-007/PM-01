const { sendEmail } = require('./sendEmail'); // Make sure this is correctly imported

const sendNotification = async (catalystApp, data, template, userDetail) => {
  try {
    // Send email and wait for it to complete
    await sendEmail(catalystApp, userDetail, template);

    // Insert notification data into Catalyst datastore
    const datastore = catalystApp.datastore();
    const notificationTable = datastore.table("Notifications");
    await notificationTable.insertRow(data);

    console.log("Notification sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in sendNotification:", error.message);
    throw error;
  }

};

module.exports = { sendNotification };
