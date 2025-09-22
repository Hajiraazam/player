const asyncHandler = (requestHandler) => {
 return (req,res,next) => {
    Promise.response(requestHandler(req,res,next)).catch(()=>next(err))
  }
}


// export const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message : error.message
//         })
//     }
// }