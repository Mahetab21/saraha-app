

export const authorization = (accessRoles=[]) => {
    return (req, res, next) => {
        if(! accessRoles.includes(req?.user?.role)){
            throw new Error("You are not authorized to access this resource",{cause:401})
        }
        return next();
    }
}
