const mongoose= require("mongoose")

const wordSchema= new mongoose.Schema({
    word: {
        type: String,
        required: [true, "Word is mandatory"],
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    category: {
        type: String
    },
    difficulty: {
        type: String,
        default: "Medium",
        enum: ["easy", "medium", "hard"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

wordSchema.statics.findByCategory= function(category){
    return this.find({ category:  category});
}

wordSchema.statics.findByDifficulty= function(difficulty){
    return this.find({difficulty: difficulty});
}

wordSchema.statics.todayCreatedWords= function(){
    // We are going to find out all the words that are create today
     const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);  // sets time to 00:00:00

    return this.find({ createdAt: { $gte: startOfDay } });
}

wordSchema.statics.todayUpdatedWords= function(){
     const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);  // sets time to 00:00:00

    return this.find({ updatedAt: { $gte: startOfDay } });
}

// going to defne the methods for the statitics
wordSchema.statics.totalCreatedWords= function(){
       return this.countDocuments();
}

wordSchema.statics.totalWordsOfACategory=function(){
    return this.find({category: category}).countDocuments();
}

wordSchema.statics.todayCreatedWordCount= function(){
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);  // sets time to 00:00:00

    return this.find({ createdAt: { $gte: startOfDay } }).countDocuments();
} 

const Word= mongoose.model("Word", wordSchema);
module.exports= Word;
