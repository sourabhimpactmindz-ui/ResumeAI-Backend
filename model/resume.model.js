import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
    {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    filename : {
        type : String,
        required : true
    },

    fileUrl : {
        type : String,
        required : true
    },
    
    atsScore : {
        type : Number,
        default : 0,
    },

    strength : {
        type : [String],

    },

    extractedText : {
        type : String,
        default : "",
    },

    jobDescription : {
        type : String,
        default : "",
    },

    missingSkills : [String],

    suggestions :[String],

    matchingSkills: {
  type: [String],
  default: []
},


},{timestamps : true}

);

const Resume = mongoose.model('Resume' , resumeSchema);
export default Resume;