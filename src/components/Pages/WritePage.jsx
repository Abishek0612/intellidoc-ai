import React, { useEffect } from "react";
import { useApp } from "../../context/AppContext";

const WritePage = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: "editor" });
  }, [dispatch]);

  return null;
};

export default WritePage;
