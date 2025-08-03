import React from "react";
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/Layout/AppLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="text-sm"
        bodyClassName="text-sm"
        style={{
          fontSize: "14px",
        }}
        toastStyle={{
          fontSize: "14px",
          padding: "12px",
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 768px) {
            .Toastify__toast-container {
              width: calc(100vw - 2rem);
              left: 1rem;
              right: 1rem;
              margin: 0;
            }
            .Toastify__toast {
              margin-bottom: 0.5rem;
              border-radius: 8px;
              font-size: 13px;
              padding: 10px;
            }
          }
        `,
        }}
      />
    </AppProvider>
  );
};

export default App;
