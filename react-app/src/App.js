import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Layout1 from "./Admin/Layout1";
import EmpLayout from "./Employee/Layout1";
import Project from "./Admin/Project";
import Task from "./Admin/Task";
import Feedback from "./Admin/Feedback";
import Employees from "./Admin/Employee";
import Profile from "./Admin/Profile";
import EmpDashboard from "./Employee/Dashboard";
import EmpProject from "./Employee/Project";
import EmpTask from "./Employee/Task";
import EmpProfile from "./Employee/Profile";
import Emp from "./Employee/Employee";
import EmpFeedback from "./Employee/Feedback";
import axios from "axios";

import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "./redux/Project/ProjectSlice";
import {
  fetchEmployees,
  setEmployeeProfilePics,
} from "./redux/Employee/EmployeeSlice";
import { fetchTasks } from "./redux/Tasks/TaskSlice";
import { fetchProfile } from "./redux/Profile/Profile";
import { fetchFeedback } from "./redux/Feedback/Feedback";
import Login from "./Admin/Login";
import { fetchEmpProject } from "./redux/EmpProject/EmpProjectSlice";
import { fetchEmpTask } from "./redux/EmpTask/EmpTaskSlice";
import { EmpIssues } from "./Employee/EmpIssues";
import { Issues } from "./Admin/Issue";
import { Client } from "./Admin/Client";
import { ClientStaff } from "./Admin/ClientStaff";
import EmpEnhancedDashboard from "./Employee/EnhancedDashboard";
import ContactDashboard from "./Client/ContactDashboard";
import CustomerLayout from "./Client/Layout1";
import ContactTask from "./Client/ContactTask";
import ContactProjects from "./Client/Project";
import ContactIssues from "./Client/Issue";
import Contacts from "./Client/Contacts";
import ContactProfile from "./Client/Profile";
import EnhancedDashboard from "./Admin/EnhancedDashboard";
import { dividerClasses } from "@mui/material";
function App() {
  const [userRole, setUserRole] = useState(null);
  const [currUser, setCurrUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();
  const { data: employeesData, profilePics } = useSelector(
    (state) => state.employeeReducer
  );
  const placeholderURL =
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const savedcurrUser = localStorage.getItem("currUser");
  //       let userDetail = null;

  //       if (!savedcurrUser) {
  //         const result = await window.catalyst.auth.isUserAuthenticated();

  //         userDetail = {
  //           userid: result.content.user_id,
  //           firstName: result.content.first_name,
  //           lastName: result.content.last_name,
  //           mailid: result.content.email_id,
  //           timeZone: result.content.time_zone,
  //           createdTime: result.content.created_time,
  //           role: result.content.role_details.role_name,
  //           user_type: result.content.user_type,
  //           org_id: result.content.org_id,
  //         };
  //         localStorage.setItem("currUser", JSON.stringify(userDetail));


  //         // Adding code statrts 
  //         if(result && result.content){
  //           setUserRole(result.content.role_details.role_name)
  //           setCurrUser(result.content);
  //           setIsAuthenticated(true);
  //         }
  //       } 
  //       else {
  //         try {
  //           // userDetail = JSON.parse(savedcurrUser);

  //         } catch (error) {
  //           console.error("Failed to parse currUser:", error);
  //           localStorage.removeItem("currUser");
  //         }
  //       }

  //       if (userDetail) {
  //         setCurrUser(userDetail);
  //         setUserRole(userDetail.role);
  //         setIsAuthenticated(true);

  //         const profileResponse = await axios.get(
  //           `/server/time_entry_management_application_function/userprofile/${userDetail.userid}`
  //         );
  //         const coverResponse = await axios.get(
  //           `/server/time_entry_management_application_function/usercover/${userDetail.userid}`
  //         );

  //         if (profileResponse.data.data) {
  //           localStorage.setItem("profileData", profileResponse.data.data);
  //         } else {
  //           localStorage.setItem(
  //             "profileData",
  //             "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
  //           );
  //         }

  //         if (coverResponse.data.data) {
  //           localStorage.setItem("coverData", coverResponse.data.data);
  //         } else {
  //           localStorage.setItem(
  //             "coverData",
  //             "https://media.licdn.com/dms/image/v2/D563DAQHzNlFsRnMJDg/image-scale_191_1128/image-scale_191_1128/0/1699936674657/fi_digital_services_cover?e=2147483647&v=beta&t=ra0dfMKNg51crI9H1y9cKrtDrSfsOhgON6X_f2Gli7g"
  //           );
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Authentication error:", error);
  //       setIsAuthenticated(false);
  //     } finally {
  //       setIsCheckingAuth(false);
  //     }
  //   };

  //   checkAuth();
  // }, []);

    
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedcurrUser = localStorage.getItem("currUser");
        let userDetail = null;

        console.log("saved",savedcurrUser)
  
        if (!savedcurrUser) {

          console.log("dnkdlf");
          const result = await window.catalyst.auth.isUserAuthenticated();

          console.log("resulttss",result)
          userDetail = {
            userid: result.content.user_id,
            firstName: result.content.first_name,
            lastName: result.content.last_name,
            mailid: result.content.email_id,
            timeZone: result.content.time_zone,
            createdTime: result.content.created_time,
            role: result.content.role_details.role_name,
            user_type: result.content.user_type,
            org_id: result.content.org_id,
          };
          localStorage.setItem("currUser", JSON.stringify(userDetail));
        } else {
          try {
            userDetail = JSON.parse(savedcurrUser);
          } catch (error) {
            console.error("Failed to parse currUser:", error);
            localStorage.removeItem("currUser");
          }
        }
  
        if (userDetail) {
          setCurrUser(userDetail);
          setUserRole(userDetail.role);
          setIsAuthenticated(true);
  
          // ⏳ Background fetch for profile and cover
          fetchProfileAndCover(userDetail.userid);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
  
    const fetchProfileAndCover = async (userId) => {
      try {
        const profileResponse = await axios.get(
          `/server/time_entry_management_application_function/userprofile/${userId}`
        );
        const coverResponse = await axios.get(
          `/server/time_entry_management_application_function/usercover/${userId}`
        );
  
        localStorage.setItem(
          "profileData",
          profileResponse.data.data || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
        );
  
        localStorage.setItem(
          "coverData",
          coverResponse.data.data || "https://media.licdn.com/dms/image/v2/D563DAQHzNlFsRnMJDg/image-scale_191_1128/image-scale_191_1128/0/1699936674657/fi_digital_services_cover?e=2147483647&v=beta&t=ra0dfMKNg51crI9H1y9cKrtDrSfsOhgON6X_f2Gli7g"
        );
      } catch (err) {
        console.error("Failed to fetch profile or cover:", err);
      }
    };
  
    checkAuth();
  }, []);
  



  useEffect(() => {
    if (!isAuthenticated) return;
    if (userRole === "Contacts") return;
    const fetchData = async () => {
      try {
        const employeeResponse = await dispatch(fetchEmployees()).unwrap(); // wait until employees are fetched

        // const employeesWithPlaceholders = employeeResponse?.map((employee) => ({
        //   ...employee,
        //   profile_pic: placeholderURL,
        // }));

        // dispatch(setEmployeeProfilePics(employeesWithPlaceholders));

         console.log("Employees with placeholders", employeeResponse);

        const result = await axios.post(
          "/server/time_entry_management_application_function/batchProfile",
          employeeResponse
        );
        const updatedEmployees = result.data.data;
         console.log("batch profile result",updatedEmployees)

         dispatch(setEmployeeProfilePics(updatedEmployees));
      } catch (error) {
        console.error("Error fetching employees or profiles", error);
      }
    };

    fetchData();
  }, [dispatch,userRole, isAuthenticated]);



  
  if (isCheckingAuth) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h1
          style={{
            marginBottom: "50px",
            color: "#333",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          DSV-360
        </h1>
        <div className="loader" style={{ marginTop: "30px" }}></div>
      </div>
    );
  }

  if (!currUser) {
    window.location.href = "/__catalyst/auth/login";
    return null;
  }

  return (
    <Routes>
      <Route path="login" element={<Login />} />

      {userRole === "Super Admin" || userRole === "Admin" ? (
        <Route path="/" element={<Layout1 />}>
          <Route index element={<EnhancedDashboard />} />
          <Route path="projects" element={<Project currUser={currUser} />} />
          <Route path="task" element={<Task />} />
          <Route path="employees" element={<Employees />} />
          <Route path="profile" element={<Profile />} />
          {/* <Route path="feedback" element={<Feedback />} /> */}
          {/* <Route path="feedback" element={<ProjectReport/>}/> */}
          <Route path="bug" element={<Issues />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="client" element={<Client />} />
          <Route path="clientStaff" element={<ClientStaff />} />
        </Route>
      ) : (
        <>
          {userRole === "Contacts" ? (
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<ContactDashboard />} />
              <Route
                path="projects"
                element={<ContactProjects currUser={currUser} />}
              />
              <Route path="task" element={<ContactTask />} />
              <Route path="bug" element={<ContactIssues />} />
              <Route path="Contacts" element={<Contacts />} />
              <Route path="profile" element={<ContactProfile />} />
            </Route>
          ) : (
            <Route path="/" element={<EmpLayout />}>
              {/* <Route index element={<EmpDashboard />} /> */}
              <Route index element={<EmpEnhancedDashboard />} />
              <Route
                path="projects"
                element={<EmpProject currUser={currUser} />}
              />
              <Route path="task" element={<EmpTask />} />
              <Route path="bug" element={<EmpIssues />} />
              <Route path="employees" element={<Emp />} />
              <Route path="profile" element={<EmpProfile />} />
              <Route path="feedback" element={<EmpFeedback />} />
            </Route>
          )}
        </>
      )}
    </Routes>
  );
}

export default App;
