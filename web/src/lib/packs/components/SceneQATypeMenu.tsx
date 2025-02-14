import { useRef, forwardRef } from "react";
import styled from "styled-components";
import { theme } from "~/styles/theme";
import { Button } from "~/components";
import { Props as ScenePreviewProps } from "~/lib/packs/components/ScenePreview";
import { AnswerTypeSlugs, QuestionTypeSlugs } from "~/lib/game/gameUtils";
import { usePackStore, VisibleQATypeMenu } from "~/lib/packs/packStore";
import { useUpdateScene } from "~/lib/packs/useSceneActions";
import { useOnClickOutside } from "~/utils/element";

export const SceneQATypeMenu = ({ scene }: ScenePreviewProps) => {
  const ref = useRef(null);
  const { updateScene } = useUpdateScene(scene);
  const setQATypeMenu = usePackStore((state) => state.setVisibleQATypeMenu);
  const QATypeMenu = usePackStore((state) => state.visibleQATypeMenu);

  const onSelectType = (updatedScene = {}) => {
    setQATypeMenu(VisibleQATypeMenu.None);
    if (updatedScene) {
      updateScene(updatedScene);
    }
  };

  useOnClickOutside(ref, () => {
    setQATypeMenu(VisibleQATypeMenu.None);
  });

  switch (QATypeMenu) {
    case VisibleQATypeMenu.Question:
      return (
        <QuestionTypeMenu
          currentType={scene.questionType}
          onSelectType={onSelectType}
          ref={ref}
        />
      );
    case VisibleQATypeMenu.Answer:
      return (
        <AnswerTypeMenu
          currentType={scene.answerType}
          onSelectType={onSelectType}
          sceneAnswers={scene.answers}
          ref={ref}
        />
      );
    default:
      return null;
  }
};

type Props = {
  currentType: string;
  onSelectType: (scene: any) => void;
  sceneAnswers?: any[] | null;
};

// Maps question type to the default set of questions
const defaultQuestionsMap = {
  [QuestionTypeSlugs.text.id]: "Hello in there?",
  [QuestionTypeSlugs.image.id]: "/illustrations/pusheen.gif",
  [QuestionTypeSlugs.audio.id]: "/sounds/theme.mp3",
  [QuestionTypeSlugs.video.id]: "https://youtu.be/dQw4w9WgXcQ",
  [QuestionTypeSlugs.code.id]: JSON.stringify({
    code: "console.log('Hello World')",
    language: "javascript",
  }),
};

const QuestionTypeMenu = forwardRef<HTMLDivElement, Props>(
  function QuestionTypeMenu({ currentType, onSelectType }, ref) {
    return (
      <QATypeMenuContainer content="Question type:" ref={ref}>
        {Object.entries(QuestionTypeSlugs).map(([key, value]) => {
          return (
            <Button
              key={key}
              className={currentType === value.id ? "selected" : ""}
              onClick={() => {
                onSelectType(
                  currentType === value.id
                    ? false
                    : {
                        questionType: { slug: value.id },
                        question: defaultQuestionsMap[value.id],
                      }
                );
              }}
            >
              {value.display}
            </Button>
          );
        })}
      </QATypeMenuContainer>
    );
  }
);

// Maps answer type to the default set of answers
const defaultAnswersMap = {
  [AnswerTypeSlugs.text.id]: [],
  [AnswerTypeSlugs.multiText.id]: [
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ],
  // [AnswerTypeSlugs.letterText.id]: [],
};

const AnswerTypeMenu = forwardRef<HTMLDivElement, Props>(
  function AnswerTypeMenu({ currentType, onSelectType, sceneAnswers }, ref) {
    return (
      <QATypeMenuContainer content="Answer type:" ref={ref}>
        {Object.entries(AnswerTypeSlugs).map(([key, value]) => {
          return (
            <Button
              key={key}
              className={currentType === value.id ? "selected" : ""}
              onClick={() => {
                const correct = sceneAnswers?.find((a) => a.isCorrect);
                onSelectType(
                  currentType === value.id
                    ? false
                    : {
                        answerType: { slug: value.id },
                        sceneAnswers: [
                          ...[correct || { content: "", isCorrect: true }],
                          ...defaultAnswersMap[value.id],
                        ],
                      }
                );
              }}
            >
              {value.display}
            </Button>
          );
        })}
      </QATypeMenuContainer>
    );
  }
);

export const QATypeMenuContainer = styled.div<{ content: string }>`
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  border: 2px solid;
  border-radius: 50px;
  background: ${theme.ui.background};
  display: flex;
  width: fit-content;

  > button,
  > button:hover {
    border: none;
    border-right: 2px solid;
    animation: none;
    transition: background-color 0.1s ease;

    &:first-child {
      border-top-left-radius: 30px;
      border-bottom-left-radius: 30px;
    }

    &:last-child {
      border-right: none;
      border-top-right-radius: 30px;
      border-bottom-right-radius: 30px;
    }

    &.selected {
      background-color: ${theme.ui.buttonSelected};
    }
  }

  > button:hover {
    background-color: ${theme.ui.backgroundGrey};
  }

  &::after {
    position: absolute;
    content: "${({ content }) => content}";
    display: inline-block;
    top: ${theme.spacings(-4)};
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    text-align: center;
    background: ${theme.ui.background};
    border-radius: ${theme.ui.borderWavyRadius};
    font-size: 0.9rem;
    padding: 4px;
  }
`;
