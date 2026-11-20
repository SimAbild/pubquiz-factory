export function getQuizzesForDay(quizzes, day) {

    return quizzes.filter((quiz) => quiz.days.includes(day));
}
