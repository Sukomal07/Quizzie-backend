import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/error.js'
import { ApiResponse } from '../utils/response.js'
import Quiz from "../models/quiz.model.js";

export const createQuiz = asyncHandler(async (req, res) => {
    const { quizName, quizType, questions } = req.body;

    if (!quizName || !quizType) {
        throw new ApiError(400, 'Quiz name and type required')
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, 'quiz questions is required');
    }

    if (questions.length < 1 || questions.length > 5) {
        throw new ApiError(400, 'Number of questions should be between 1 and 5');
    }

    questions.forEach((question) => {
        const { questionName, optionType, options } = question;

        if (!questionName || !optionType) {
            throw new ApiError(400, 'Question name & option type are required')
        }
        if (!options || !Array.isArray(options) || options.length === 0) {
            throw new ApiError(400, 'question options are required');
        }

        if (options.length < 2 || options.length > 4) {
            throw new ApiError(400, 'minimum 2 and maximum 4 options needed')
        }

        options.forEach((option) => {
            const { option: optionText } = option;
            if (optionText.trim().length === 0) {
                throw new ApiError(400, 'Option text cannot be empty');
            }
        });
    });

    if (quizType === 'Q&A') {
        options.forEach((option) => {
            const { isCorrect } = option;

            if (typeof isCorrect !== 'boolean') {
                throw new ApiError(400, 'isCorrect only true or false');
            }
        });

        questions.forEach((question) => {
            const { timerOption } = question;
            if (!timerOption) {
                throw new ApiError(400, 'Please enter timer')
            }
        })
    }

    const newQuiz = new Quiz({
        quizName,
        quizType,
        questions,
        owner: req.user?._id,
    });

    try {
        await newQuiz.validate();
    } catch (error) {
        const validationErrors = [];
        for (const key in error.errors) {
            validationErrors.push(error.errors[key].message);
        }
        throw new ApiError(400, validationErrors.join(', '));
    }

    await newQuiz.save();

    res.status(201).json(
        new ApiResponse(201, newQuiz, 'Quiz created successfully')
    );
})
