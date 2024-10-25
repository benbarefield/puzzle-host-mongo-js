import * as puzzleAnswerData from "./src/puzzleAnswerData";
import * as puzzleData from "./src/puzzleData";
import sessionStarter  from "./src/sessionStarter";
import testingStart from "./src/testHarness";

export default {
  ...puzzleData,
  ...puzzleAnswerData,
  sessionStarter,
  testingStart,
}
