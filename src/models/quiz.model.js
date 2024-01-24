import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const optionSchema = new Schema({
    text: {
        type: String,
    },
    imageUrl: {
        type: String,
    },
    isCorrect: {
        type: Boolean,
        required: function () {
            return this.parent().quizType === 'Q&A';
        },
    },
    totalAttempts: {
        type: Number,
        default: 0,
    },
});

const questionSchema = new Schema({
    questionName: {
        type: String,
        required: [true, 'question name is required'],
    },
    optionType: {
        type: String,
        enum: ['text', 'image', 'text_and_image'],
        required: true,
    },
    timerOption: {
        type: String,
        enum: ['off', '5', '10'],
        required: function () {
            return this.parent().quizType === 'Q&A';
        },
    },
    options: [optionSchema],
    totalAttempts: {
        type: Number,
        default: 0,
    },
    totalCorrectAttempts: {
        type: Number,
        default: 0
    },
    totalIncorrectAttempts: {
        type: Number,
        default: 0
    }
});

const quizSchema = new Schema({
    quizName: {
        type: String,
        required: [true, 'quiz name is required'],
    },
    quizType: {
        type: String,
        enum: ['Q&A', 'Poll'],
        required: [true, 'quiz type is required'],
    },
    questions: [questionSchema],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    views: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

quizSchema.plugin(aggregatePaginate);

const Quiz = model('Quiz', quizSchema);

export default Quiz;
