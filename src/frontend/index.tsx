import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from 'react-router-dom';
import { App } from "./components/App";


const Main = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<Main />);
}