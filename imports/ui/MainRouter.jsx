// imports/ui/MainRouter.jsx

// Pages
//import Admin from './pages/Admin';





// const pageVariants = {
//     initial: {
//         opacity: 0,
//         y: 24,
//     },
//     animate: {
//         opacity: 1,
//         y: 0,
//         transition: { duration: 0.35, ease: 'easeOut' }
//     },
//     exit: {
//         opacity: 0,
//         y: -24,
//         transition: { duration: 0.25, ease: 'easeIn' }
//     }
// };

// const prefersReducedMotion =
//     typeof window !== 'undefined' &&
//     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// // const MotionWrapper = ({ children }) => (
// //     prefersReducedMotion ? <>{children}</> : (
// //         <AnimatePresence mode="wait">
// //             <motion.div
// //                 initial="initial"
// //                 animate="animate"
// //                 exit="exit"
// //                 variants={pageVariants}
// //                 style={{ minHeight: '100vh' }}
// //             >
// //                 {children}
// //             </motion.div>
// //         </AnimatePresence>
// //     )
// );

const MainRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<MotionWrapper><WelcomePage /></MotionWrapper>} />
            <Route path="/checkin" element={<MotionWrapper><App /></MotionWrapper>} />
            <Route path="/s/:token" element={<MotionWrapper><StationKiosk /></MotionWrapper>} />
            <Route path="/admin" element={<ProtectedRoute><MotionWrapper><StationDashboard /></MotionWrapper></ProtectedRoute>} />
            <Route path="/admin/stations" element={<ProtectedRoute><MotionWrapper><StationBuilder /></MotionWrapper></ProtectedRoute>} />
            <Route path="/admin/surveys" element={<ProtectedRoute><MotionWrapper><SurveyManager /></MotionWrapper></ProtectedRoute>} />
            <Route path="/admin/checkins" element={<ProtectedRoute><MotionWrapper><StationDashboard /></MotionWrapper></ProtectedRoute>} />
            <Route path="/login" element={<MotionWrapper><Login /></MotionWrapper>} />
            <Route path="/thankyou" element={<MotionWrapper><ThankYou /></MotionWrapper>} />
        </Routes>
    </BrowserRouter>
);

export default MainRouter;
