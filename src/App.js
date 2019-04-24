import React, { useReducer, useState } from 'react';
import { Machine, interpret, assign } from 'xstate';
import { useMachine } from '@xstate/react';

function Screen({ children, onSubmit = undefined }) {
  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="screen">
        {children}
      </form>
    );
  }

  return <section className="screen">{children}</section>;
}

function QuestionScreen({ onClickGood, onClickBad, onClose }) {
  return (
    <Screen>
      <header>How was your experience?</header>
      <button onClick={onClickGood} data-variant="good">
        Good
      </button>
      <button onClick={onClickBad} data-variant="bad">
        Bad
      </button>
      <button title="close" onClick={onClose} />
    </Screen>
  );
}

function FormScreen({ onSubmit, onClose }) {
  const [response, setResponse] = useState('');

  return (
    <Screen
      onSubmit={e => {
        e.preventDefault();

        console.log('RESPONSE:', response);

        onSubmit(response);
      }}
    >
      <header>Care to tell us why?</header>
      <textarea
        name="response"
        placeholder="Complain here"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.stopPropagation();
          }
        }}
        value={response}
        onChange={event => setResponse(event.target.value)}
      />
      <button>Submit</button>
      <button title="close" type="button" onClick={onClose} />
    </Screen>
  );
}

function ThanksScreen({ onClose, response = '' }) {
  return (
    <Screen>
      <header>Thanks for your feedback: {response}</header>
      <button title="close" onClick={onClose} />
    </Screen>
  );
}

const feedbackMachine = Machine(
  {
    initial: 'question',
    context: {
      response: ''
    },
    states: {
      question: {
        on: {
          GOOD: {
            target: 'thanks',
            actions: 'logGood'
          },
          BAD: 'form',
          CLOSE: 'closed'
        },
        onExit: ['logExit']
      },
      form: {
        on: {
          SUBMIT: [
            {
              target: 'thanks',
              actions: assign({
                response: (context, event) => {
                  return event.value;
                }
              }),
              cond: 'formValid'
            },
            {
              target: 'form',
              actions: 'alertInvalid'
            }
          ],
          CLOSE: 'closed'
        }
      },
      thanks: {
        onEntry: 'logEntered',
        on: {
          CLOSE: 'closed'
        }
      },
      closed: {}
    }
  },
  {
    actions: {
      logExit: (context, event) => {
        console.log('exited', event);
      },
      alertInvalid: () => {
        alert('You did not fill out the form!!');
      }
    },
    guards: {
      formValid: (context, event) => {
        return event.value.length > 0;
      }
    }
  }
);

export function Feedback() {
  const [current, send] = useMachine(feedbackMachine);

  console.log('RENDERED');
  console.log(current.context);

  return current.matches('question') ? (
    <QuestionScreen
      onClickGood={() => {
        send('GOOD');
      }}
      onClickBad={() => {
        send('BAD');
      }}
      onClose={() => {
        send('CLOSE');
      }}
    />
  ) : current.matches('form') ? (
    <FormScreen
      onSubmit={value => {
        send({ type: 'SUBMIT', value: value });
      }}
      onClose={() => {
        send('CLOSE');
      }}
    />
  ) : current.matches('thanks') ? (
    <ThanksScreen
      response={current.context.response}
      onClose={() => {
        send('CLOSE');
      }}
    />
  ) : current.matches('closed') ? null : null;
}

export function App() {
  return (
    <main className="app">
      <Feedback />
    </main>
  );
}

export default App;
