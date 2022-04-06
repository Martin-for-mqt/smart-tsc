import chalk from "chalk";

function formatOutput(errors) {
    errors.forEach((error) => {
        console.log(`${chalk.blueBright(error.filepath)}:${chalk.yellow(error.line)}:${chalk.yellow(error.column)} - ${chalk.red(error.category)} ${chalk.gray(error.type + ':')} ${error.message} \n\n`)
    })
}

export default formatOutput 