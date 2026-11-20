
export function getQuizzesForDay(quizzes, day) {
    return quizzes.filter((quiz) => quiz.days.includes(day));
}

export function countQuizzesForDay(quizzes,day) {
    return getQuizzesForDay(quizzes, day).length;
}