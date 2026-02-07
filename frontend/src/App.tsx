import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TaskList } from "./pages/TaskList";
import { TaskDetail } from "./pages/TaskDetail";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TaskList />} />
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </Layout>
  );
}
