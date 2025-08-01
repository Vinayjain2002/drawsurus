const mongoose= require("mongoose")
const bcrypt= require('bcryptjs')

const userSchema= new mongoose.Schema({
    userName: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    passwordHash: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be atleast 6 characters"]
    },
    avatar: {
        type: String,
        default: null
    },
    createdAt: {
        type: String,   
        default: Date.now   
    },
    lastOnline: {
        type: Date,
        default: Date.now
    },
    currentRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    totalGamesPlayed: {
        type: Number,
        default: 0
    },
    totalWins: {
        type: Number,
        default: 0
    },
    enterpriseTag: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});




userSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.passwordHash = bcrypt.hashSync(password, 12);
  });

userSchema.method.comparePassword= function(candidatePassword){
    return bcrypt.compareSync(candidatePassword, this.passwordHash);
}
userSchema.methods.updateLastOnline = function() {
    this.lastOnline = new Date();
    return this.save();
  };
  
  userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
  };
  
  userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username });
  };
  
  userSchema.index({ email: 1 });
  userSchema.index({ username: 1 });
  userSchema.index({ enterpriseTag: 1 });
  userSchema.index({ isOnline: 1 });
  
  module.exports = mongoose.model('User', userSchema); 