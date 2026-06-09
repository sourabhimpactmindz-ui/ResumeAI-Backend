import jwt from 'jsonwebtoken';

export const userAuth = async(req,res , next)=> {
    const authHead = req.headers.authorization;

    if(!authHead){
        return res.status(401).json({message : "Token missing" , status:false})

    }

    const token = authHead.split(' ')[1];

    try{
        const decode = jwt.verify(token,process.env.SECRET_KEY);
        req.userid = decode.id;
        next();
    }
    catch{
        return res.status(401).json({message: "Token expired or invalid", status:false})
    }
}