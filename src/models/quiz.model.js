import { Schema, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const optionSchema = new Schema({
    option: {
        text: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
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

questionSchema.methods.getAnalysis = function () {
    const analysis = {
        totalAttempts: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        optionAnalysis: {},
    };

    if (this.quizType === 'Q&A') {
        this.options.forEach((option) => {
            analysis.optionAnalysis[option.option] = {
                totalAttempts: option.totalAttempts,
                totalCorrect: option.isCorrect ? option.totalAttempts : 0,
                totalIncorrect: option.isCorrect ? 0 : option.totalAttempts,
            };

            analysis.totalAttempts += option.totalAttempts;
            if (option.isCorrect) {
                analysis.totalCorrect += option.totalAttempts;
            } else {
                analysis.totalIncorrect += option.totalAttempts;
            }
        });
    } else if (this.quizType === 'Poll') {
        this.options.forEach((option) => {
            analysis.optionAnalysis[option.option] = {
                totalAttempts: option.totalAttempts,
            };
        });
    }

    return analysis;
};

quizSchema.plugin(aggregatePaginate);

const Quiz = model('Quiz', quizSchema);

export default Quiz;
