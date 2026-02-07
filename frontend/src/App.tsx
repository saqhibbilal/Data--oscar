import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { CreateTask } from "./pages/CreateTask";
import { TaskDetail } from "./pages/TaskDetail";
import { MyActivity } from "./pages/MyActivity";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/activity" element={<MyActivity />} />
      </Routes>
    </Layout>
  );
}
