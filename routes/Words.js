const express= require("express")
const router= express.Router();
const wordController= require("../controllers/wordController")

//router for the creation of words
router.post("/", wordController.createWord);
router.post("/many",wordController.createMultipleWords );
// router for getting the words on the basis of category and difficulty
router.get("/", wordController.getWord);

// for getting words on basis of difficulty
router.get("/difficulty", wordController.getWordsOnDifficulty);

//for getting today created words
router.get("/todayCreated", wordController.getTodayCreatedWords);

module.exports= router;