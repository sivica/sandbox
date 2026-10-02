import React from "react";
import {createRoot} from "react-dom/client";
import {BookingApp} from "./booking-app.js";
createRoot(document.getElementById("root")).render(React.createElement(BookingApp));
