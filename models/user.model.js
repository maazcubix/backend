import mongoose ,{Schema}  from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema=new Schema ({

    username:{
        type:String,
        unique:true,
        required:true,
        lonwercase:true,
        trim:true,
        index:true
    },

    email:{
        type:String,
        unique:true,
        required:true,
        lonwercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true        
    },
    avatar:{
        type:String,
        required:true
    },
    coverImage:String,
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshTOken:{
            type:String
    }

},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    
    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= async function(){
   return await  jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username
    },
    "maaaz",{
        expiresIn:"1d"
    }

)
}
userSchema.methods.generateRefreshToken= async function(){

    return await  jwt.sign({
        _id:this._id,
   
    },
    "maaaz",{
        expiresIn:"10d"
    }

)
}

export const User=mongoose.model("User",userSchema)