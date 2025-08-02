import React, { useEffect } from "react";
import { useApp } from "../../context/AppContext";

const WritePage: React.FC = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: "editor" });
  }, [dispatch]);

  return null;
};

export default WritePage;
