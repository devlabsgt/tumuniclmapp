'use client';

import { Typewriter } from 'react-simple-typewriter';

interface Props {
  textos: string[];
}

export default function Typeanimation({ textos }: Props) {
  return (
    <Typewriter
      words={textos}
      loop={1}
      cursor
      cursorStyle="|"
      typeSpeed={50}
      deleteSpeed={40}
      delaySpeed={1500}
    />
  );
}
