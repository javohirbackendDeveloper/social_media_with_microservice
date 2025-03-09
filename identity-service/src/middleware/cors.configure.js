// const cors = require("cors");

// function corsConfigure() {
//   return cors({
//     origin: (origin, callback) => {
//       const allowedOrigins = [
//         "http://localhost:5173",
//         "https://frontend_domain.com",
//       ];

//       if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by cors"));
//       }
//     },
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["X-Total-Count", "Content-Range"],
//     credentials: true,
//     maxAge: 600,
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   });
// }

// module.exports = { corsConfigure };
