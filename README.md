### 📢 **Digital Notice Board System**

**Digital Notice Board** is a web-based notice management system designed to make college announcements faster, organized, and easily accessible. It allows admins, faculty, coordinators, and students to manage and view notices based on their roles.

#### 🔧 Features

* **User Authentication** – Secure login and registration using JWT authentication
* **Role-Based Dashboard** – Separate dashboards for Admin, Faculty, Coordinator, and Student
* **Notice Posting System** – Admin, faculty, and coordinators can create notices
* **Image Upload Support** – Upload posters or images along with notices
* **Notice Management** – Edit, delete, pin, and unpin notices
* **Priority & Category Selection** – Notices can be categorized and marked with priority levels
* **Expiry Date Handling** – Notices can be shown only while active
* **Coordinator Permission Management** – Faculty/Admin can grant or remove coordinator access
* **Student Notice Browsing** – Students can view all active notices in a clean interface
* **Audit Logging** – Notice create, update, delete, and pin actions are logged

#### 🛠️ How It Works

1. **User Registers/Login** – User logs in based on role such as admin, faculty, coordinator, or student
2. **Dashboard Opens** – System redirects user to the correct dashboard
3. **Post Notice** – Authorized users add title, content, category, expiry date, priority, and image
4. **View Notices** – Notices are displayed as cards and refreshed automatically
5. **Manage Notices** – Admin/faculty/coordinator can edit, delete, pin, or unpin notices
6. **Manage Users** – Admin manages users, while faculty can assign students as coordinators

#### 💻 Tech Stack

* **Frontend:** React.js, JavaScript, CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Authentication:** JWT, bcryptjs
* **File Upload:** Multer
* **API Communication:** Axios
* **Other Tools:** React Router, Mongoose

📢 *Built to simplify campus communication by replacing traditional notice boards with a fast, digital, role-based announcement system.*
