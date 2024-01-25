import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/error.js'
import { ApiResponse } from '../utils/response.js'
import Quiz from "../models/quiz.model.js";
import mongoose from 'mongoose'

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
        const { questionName, optionType, options, timerOption } = question;

        if (!questionName || !optionType) {
            throw new ApiError(400, 'Question name & option type are required')
        }
        if (!options || !Array.isArray(options) || options.length === 0) {
            throw new ApiError(400, 'question options are required');
        }

        if (options.length < 2 || options.length > 4) {
            throw new ApiError(400, 'minimum 2 and maximum 4 options needed')
        }

        options.forEach((opt) => {
            const { text, imageUrl } = opt;

            if (quizType === 'Q&A') {
                const { isCorrect } = opt;

                if (typeof isCorrect !== 'boolean') {
                    throw new ApiError(400, 'isCorrect only true or false');
                }
                if (!timerOption) {
                    throw new ApiError(400, 'Please enter timer')
                }
            }

            if (optionType === 'text') {
                if (!text) {
                    throw new ApiError(400, 'Option text cannot be empty');
                }
            } else if (optionType === 'image') {
                if (!imageUrl) {
                    throw new ApiError(400, 'Image URL cannot be empty');
                }
            } else if (optionType === 'text_and_image') {
                if (!text || !imageUrl) {
                    throw new ApiError(400, 'Option text or image URL should be provided');
                }
            }
        });
    });

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

export const getTrendingQuiz = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const trendingQuizzes = await Quiz.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                views: -1,
            },
        },
        {
            $project: {
                quizName: 1,
                quizType: 1,
                questions: 1,
                views: 1,
                createdAt: 1,
            },
        },
        {
            $group: {
                _id: null,
                totalQuizzes: { $sum: 1 },
                totalQuestions: {
                    $sum: { $size: "$questions" },
                },
                totalViews: { $sum: "$views" },
                trendingQuizzes: { $push: "$$ROOT" },
            },
        },
        {
            $project: {
                _id: 0,
                totalQuizzes: 1,
                totalQuestions: 1,
                totalViews: 1,
                trendingQuizzes: 1,
            },
        },
    ])

    if (!trendingQuizzes.length) {
        throw new ApiError(404, 'No quiz found')
    }

    res.status(200).json(
        new ApiResponse(200, trendingQuizzes[0], 'All trending quizs')
    )
})

export const getQuizAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const allQuiz = await Quiz.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        }
    ])

    if (!allQuiz.length) {
        throw new ApiError(404, 'No quiz found')
    }

    res.status(200).json(
        new ApiResponse(200, allQuiz, 'all quizzes')
    )
})

export const deleteQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params
    const userId = req.user?._id

    const quiz = await Quiz.findByIdAndDelete({ _id: quizId, owner: userId })

    if (!quiz) {
        throw new ApiError(404, 'quiz not found')
    }

    res.status(200).json(
        new ApiResponse(200, '', 'quiz deleted successfully')
    )
})

export const updateQuiz = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { quizId } = req.params;
    const { questions } = req.body;
    const quiz = await Quiz.findOne({ _id: quizId, owner: userId });

    if (!quiz) {
        throw new ApiError(404, 'Quiz not found');
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, 'Quiz questions are required');
    }

    if (questions.length < 1 || questions.length > 5) {
        throw new ApiError(400, 'Number of questions should be between 1 and 5');
    }

    quiz.questions = [];

    questions.forEach((question) => {
        const { questionName, optionType, options } = question;

        if (!questionName || !optionType) {
            throw new ApiError(400, 'Question name and option type are required');
        }
        if (!options || !Array.isArray(options) || options.length === 0) {
            throw new ApiError(400, 'Question options are required');
        }

        if (options.length < 2 || options.length > 4) {
            throw new ApiError(400, 'Minimum 2 and maximum 4 options needed');
        }

        options.forEach((option) => {
            const { text, imageUrl } = option.option;

            if (optionType === 'text') {
                if (!text) {
                    throw new ApiError(400, 'Option text cannot be empty');
                }
            } else if (optionType === 'image') {
                if (!imageUrl) {
                    throw new ApiError(400, 'Image URL cannot be empty');
                }
            } else if (optionType === 'text_and_image') {
                if (!text || !imageUrl) {
                    throw new ApiError(400, 'Option text or image URL should be provided');
                }
            }
        });

        quiz.questions.push({ questionName, optionType, options });
    });

    if (quiz.quizType === 'Q&A') {
        questions.forEach((question) => {
            const { options, timerOption } = question;

            options.forEach((option) => {
                const { isCorrect } = option;

                if (typeof isCorrect !== 'boolean') {
                    throw new ApiError(400, 'isCorrect should be true or false');
                }
            });

            if (!timerOption) {
                throw new ApiError(400, 'Please enter timer for Q&A questions');
            }
        });
    }

    await quiz.save();

    res.status(200).json(new ApiResponse(200, quiz, 'Quiz updated successfully'));
})

export const getQuizById = asyncHandler(async (req, res) => {
    const { quizId } = req.params

    const quiz = await Quiz.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(quizId)
            }
        },
        {
            $project: {
                quizName: 1,
                quizType: 1,
                questions: 1,
                totalQuestions: { $size: "$questions" },
                createdAt: 1
            }
        }
    ])

    if (!quiz.length) {
        throw new ApiError(404, 'Quiz not found')
    }

    await Quiz.findByIdAndUpdate(quizId, { $inc: { views: 1 } }, { new: true })

    res.status(200).json(
        new ApiResponse(200, quiz[0], 'quiz fetch successfully')
    )
})

export const attemptQNAQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, 'Quiz not found');
    }

    let totalCorrectAnswers = 0;

    quiz.questions.forEach((question, index) => {
        const userAnswerIndex = answers ? answers[index] : null;
        const correctAnswerIndex = question.options.findIndex((option) => option.isCorrect);

        if (userAnswerIndex !== null) {
            question.totalAttempts += 1;

            if (correctAnswerIndex !== -1) {
                if (userAnswerIndex === correctAnswerIndex) {
                    totalCorrectAnswers++;
                    question.totalCorrectAttempts += 1;
                } else {
                    question.totalIncorrectAttempts += 1;
                }
            }
        }
    });

    await quiz.save();

    res.status(200).json(new ApiResponse(200, totalCorrectAnswers, 'Congrats Quiz is completed'));
})

export const attemptPollQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, 'Quiz not found');
    }

    answers.forEach((selectedOptionIndex, index) => {
        if (index >= 0 && index < quiz.questions.length) {
            const question = quiz.questions[index];

            if (selectedOptionIndex !== null && selectedOptionIndex >= 0 && selectedOptionIndex < question.options.length) {
                const selectedOption = question.options[selectedOptionIndex];
                selectedOption.totalAttempts += 1;
            }
        }
    });

    await quiz.save();

    res.status(200).json(new ApiResponse(200, '', 'Thank you for participating in the Poll'));
})

export const getQuestionAnalysis = asyncHandler(async (req, res) => {
    const { quizId } = req.params
    const userId = req.user?._id

    const quiz = await Quiz.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(quizId),
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                _id: 1,
                quizName: 1,
                createdAt: 1,
                views: 1,
                questions: {
                    $map: {
                        input: "$questions",
                        as: "question",
                        in: {
                            questionName:
                                "$$question.questionName",
                            totalAttempts:
                                "$$question.totalAttempts",
                            totalCorrectAttempts:
                                "$$question.totalCorrectAttempts",
                            totalIncorrectAttempts:
                                "$$question.totalIncorrectAttempts",
                            options: {
                                $map: {
                                    input: "$$question.options",
                                    as: "option",
                                    in: {
                                        totalAttempts:
                                            "$$option.totalAttempts",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    ]);

    if (!quiz.length) {
        throw new ApiError(404, 'Quiz not found');
    }

    res.status(200).json(new ApiResponse(200, quiz[0], 'Question analysis retrieved successfully'));
})