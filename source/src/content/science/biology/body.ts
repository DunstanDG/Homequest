import type { ItemGenerator } from '@/engine/registry'
import { choice } from '../../kit'
import { bankGenerators, classifyGenerators, G, type Bank } from './factory'

// =====================================================================================================================
// Skeleton, joints and muscles
// =====================================================================================================================

const skeleton: Bank = {
  skill: 'bio.body.skeleton',
  links: [
    {
      prompt: 'Match each bone to its everyday name.',
      pairs: [
        ['Femur', 'Thigh bone'],
        ['Patella', 'Kneecap'],
        ['Sternum', 'Breastbone'],
        ['Scapula', 'Shoulder blade'],
        ['Clavicle', 'Collarbone'],
        ['Tibia', 'Shinbone'],
        ['Humerus', 'Upper arm bone'],
        ['Pelvis', 'Hip bone'],
      ],
      hint: 'Patella and kneecap both have a "cap" shape; the femur is the biggest bone in the leg.',
      ask: (l) => `What is the everyday name for the ${l.toLowerCase()}?`,
      lv: [1, 4],
    },
    {
      prompt: 'Match each part of the skeleton to the organ it protects.',
      pairs: [
        ['Skull', 'Brain'],
        ['Ribcage', 'Heart and lungs'],
        ['Vertebrae (backbone)', 'Spinal cord'],
      ],
      hint: 'Think about what is directly underneath each one.',
      ask: (l) => `What ${l.startsWith('Vertebrae') ? 'do' : 'does'} the ${l.toLowerCase()} protect?`,
      lv: [1, 3],
    },
  ],
  mcqs: [
    {
      q: 'Where in the body are new blood cells made?',
      a: 'In the bone marrow, inside some bones',
      wrong: [
        { label: 'In the heart', misconception: 'heart-makes-blood', feedback: 'The heart pumps blood but does not make blood cells.' },
        { label: 'In the lungs', misconception: 'lungs-make-blood', feedback: 'The lungs are where blood picks up oxygen.' },
        { label: 'In the stomach', misconception: 'stomach-blood', feedback: 'The stomach digests food.' },
      ],
      hint: 'It is one of the four jobs of the skeleton.',
      why: 'Bone marrow, the soft tissue inside some bones, makes red blood cells and white blood cells.',
      lv: [1, 3],
    },
    {
      q: 'About how many bones are there in an adult human skeleton?',
      a: 'About 206',
      wrong: [
        { label: 'About 26', misconception: 'bones-too-few', feedback: 'There are 26 bones in each foot alone.' },
        { label: 'About 60', misconception: 'bones-60', feedback: 'There are far more: about 206.' },
        { label: 'About 2000', misconception: 'bones-too-many', feedback: 'That is about ten times too many.' },
      ],
      order: ['About 26', 'About 60', 'About 206', 'About 2000'],
      hint: 'It is a bit over two hundred.',
      why: 'An adult skeleton usually has 206 bones. Babies have more, because some bones join together as they grow.',
      lv: [1, 3],
    },
    {
      q: 'Which is the longest bone in the human body?',
      a: 'The femur (thigh bone)',
      wrong: [
        { label: 'The humerus (upper arm bone)', misconception: 'longest-humerus', feedback: 'The humerus is shorter than the femur.' },
        { label: 'The spine', misconception: 'longest-spine', feedback: 'The spine is made of many small bones (vertebrae), not one bone.' },
        { label: 'The tibia (shinbone)', misconception: 'longest-tibia', feedback: 'The tibia is long, but the femur is longer.' },
      ],
      hint: 'It is in your leg, above the knee.',
      why: 'The femur, in the thigh, is the longest and strongest bone in the body.',
      lv: [2, 4],
    },
    {
      q: 'Which mineral helps make bones hard and strong?',
      a: 'Calcium',
      wrong: [
        { label: 'Iron', misconception: 'iron-bones', feedback: 'Iron is needed to make red blood cells.' },
        { label: 'Sodium', misconception: 'sodium-bones', feedback: 'Calcium is the mineral that strengthens bones.' },
        { label: 'Carbon dioxide', misconception: 'co2-bones', feedback: 'Carbon dioxide is a waste gas, not a mineral in bones.' },
      ],
      hint: 'Milk and cheese are good sources of it.',
      why: 'Calcium (with help from vitamin D) makes bones and teeth hard and strong.',
      lv: [2, 4],
    },
    {
      q: 'Is bone a living tissue?',
      a: 'Yes: bone contains living cells and blood vessels, which is why a broken bone can heal',
      wrong: [
        { label: 'No: bones are dead, like hair', misconception: 'bone-dead', feedback: 'Bones contain living cells with a blood supply.' },
        { label: 'Only in children', misconception: 'bone-alive-children', feedback: 'Adult bones are also living tissue and can mend.' },
        { label: 'No: bones are made only of minerals', misconception: 'bone-minerals-only', feedback: 'Minerals make bone hard, but there are living cells inside it too.' },
      ],
      hint: 'What happens to a broken arm after a few weeks in a cast?',
      why: 'Bone is living tissue with cells and blood vessels. The cells can build new bone, so fractures heal.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Describe the four main functions of the skeleton, giving an example of each.',
      model: 'The skeleton supports the body and gives it shape: for example, the leg bones hold up our weight. It protects organs: the skull protects the brain and the ribcage protects the heart and lungs. It allows movement, because muscles pull on bones at joints such as the elbow. It also makes blood cells in the bone marrow inside some bones.',
      checklist: ['Support (with an example)', 'Protection (with an example)', 'Movement (with muscles or joints)', 'Making blood cells in bone marrow'],
      hint: 'Support, protection, movement, and one job that happens inside bones.',
      passMark: 3,
    },
  ],
}

const skeletonClassify = classifyGenerators('bio.body.skeleton', {
  id: 'function',
  categories: ['Support', 'Protection', 'Movement', 'Making blood cells'],
  items: [
    ['the skull surrounds the brain', 'Protection'],
    ['the ribcage surrounds the heart and lungs', 'Protection'],
    ['the vertebrae surround the spinal cord', 'Protection'],
    ['bone marrow produces red and white blood cells', 'Making blood cells'],
    ['muscles pull on bones to bend the arm at the elbow', 'Movement'],
    ['joints in the legs let you walk and run', 'Movement'],
    ['the leg bones hold up the weight of the body', 'Support'],
    ['the skeleton gives the body its shape', 'Support'],
  ],
  ask: (item) => `"${item.charAt(0).toUpperCase() + item.slice(1)}." Which function of the skeleton is this an example of?`,
  hint: 'Is it about holding the body up, keeping something safe, moving, or making something?',
  sortPrompt: 'Match each example to the function of the skeleton it shows.',
  means: {
    Support: 'The skeleton holds the body up and gives it shape.',
    Protection: 'Bones surround and protect delicate organs.',
    Movement: 'Muscles pull on bones, which move at joints.',
    'Making blood cells': 'Bone marrow inside some bones makes blood cells.',
  },
})

const muscles: Bank = {
  skill: 'bio.body.muscles',
  terms: [
    { term: 'Tendon', def: 'Tough tissue that joins a muscle to a bone' },
    { term: 'Ligament', def: 'Tough, slightly stretchy tissue that holds two bones together at a joint' },
    { term: 'Cartilage', def: 'Smooth tissue covering the ends of bones at a joint, which reduces friction and absorbs shocks' },
    { term: 'Joint', def: 'A place where two or more bones meet' },
    { term: 'Antagonistic muscles', def: 'A pair of muscles that work against each other: when one contracts, the other relaxes' },
    { term: 'Synovial fluid', def: 'An oily liquid in some joints that lubricates them so the bones move smoothly' },
  ],
  mcqs: [
    {
      q: 'Why do muscles work in pairs?',
      a: 'Muscles can only pull (by contracting), not push, so another muscle is needed to pull the bone back',
      wrong: [
        { label: 'So that one muscle can rest while the other does all the work', misconception: 'pairs-rest', feedback: 'Each muscle in the pair moves the bone in a different direction.' },
        { label: 'Because one muscle on its own is too weak to move a bone', misconception: 'pairs-strength', feedback: 'One muscle can move a bone, but only in one direction.' },
        { label: 'Muscles can push and pull, so pairs are not really needed', misconception: 'muscles-push', feedback: 'Muscles can only pull. They cannot push.' },
      ],
      hint: 'What can a muscle do when it contracts: push or pull?',
      why: 'A muscle can only pull a bone when it contracts. To move the bone back, the other muscle in the pair contracts while the first relaxes. They are called antagonistic muscles.',
      lv: [2, 4],
    },
    {
      q: 'What happens to a muscle when it contracts?',
      a: 'It gets shorter and fatter, pulling on the bone',
      wrong: [
        { label: 'It gets longer and pushes the bone', misconception: 'contract-longer', feedback: 'Contracting means getting shorter. Muscles pull, never push.' },
        { label: 'It turns into a tendon', misconception: 'contract-tendon', feedback: 'Tendons attach muscles to bones; muscles do not change into them.' },
        { label: 'Nothing changes in its length', misconception: 'contract-no-change', feedback: 'A contracting muscle shortens.' },
      ],
      hint: '"Contract" means to get smaller.',
      why: 'When a muscle contracts it gets shorter (and fatter), pulling the bone it is attached to through a tendon.',
      lv: [1, 3],
    },
    {
      q: 'Which tissue would you expect to be torn in a sprained ankle, where two bones were pulled too far apart?',
      a: 'A ligament',
      wrong: [
        { label: 'A tendon', misconception: 'ligament-tendon', feedback: 'Tendons join muscle to bone. Bone to bone is a ligament.' },
        { label: 'Cartilage', misconception: 'cartilage-sprain', feedback: 'Cartilage covers the ends of bones; it does not hold them together.' },
        { label: 'Bone marrow', misconception: 'marrow-sprain', feedback: 'Bone marrow is inside bones and makes blood cells.' },
      ],
      hint: 'Which tissue holds bone to bone?',
      why: 'Ligaments hold bones together at a joint. A sprain happens when ligaments are stretched or torn.',
      lv: [3, 5],
    },
  ],
  written: [
    {
      prompt: 'Explain how the biceps and triceps work together to bend and then straighten the arm.',
      model: 'The biceps and triceps are an antagonistic pair. To bend the arm, the biceps contracts and pulls the lower arm up, while the triceps relaxes. To straighten the arm, the triceps contracts and pulls the lower arm down, while the biceps relaxes. They work in a pair because muscles can only pull, not push.',
      checklist: ['Uses the word antagonistic (or says they work against each other)', 'Biceps contracts to bend the arm while the triceps relaxes', 'Triceps contracts to straighten the arm while the biceps relaxes', 'Says muscles can only pull, not push'],
      hint: 'Say which muscle contracts and which relaxes for each movement.',
    },
  ],
}

const jointClassify = classifyGenerators('bio.body.muscles', {
  id: 'joint-type',
  categories: ['Hinge joint', 'Ball and socket joint', 'Fixed joint'],
  items: [
    ['the elbow', 'Hinge joint'],
    ['the knee', 'Hinge joint'],
    ['the shoulder', 'Ball and socket joint'],
    ['the hip', 'Ball and socket joint'],
    ['the joints between the bones of the skull', 'Fixed joint'],
  ],
  ask: (item) => `What type of joint is ${item}?`,
  hint: 'Can it move backwards and forwards like a door, in lots of directions, or not at all?',
  sortPrompt: 'Match each joint to its type.',
  means: {
    'Hinge joint': 'A hinge joint moves backwards and forwards in one direction, like a door.',
    'Ball and socket joint': 'A ball and socket joint can move in almost all directions and rotate.',
    'Fixed joint': 'In a fixed joint the bones are joined firmly and cannot move.',
  },
})

interface Pair {
  joint: string
  bendMuscle: string
  straightenMuscle: string
  limb: string
}
const PAIRS: Pair[] = [
  { joint: 'elbow', bendMuscle: 'biceps', straightenMuscle: 'triceps', limb: 'arm' },
  { joint: 'knee', bendMuscle: 'hamstrings', straightenMuscle: 'quadriceps', limb: 'leg' },
]

/** "the biceps contracts", "the hamstrings contract" */
const PLURAL = new Set(['hamstrings'])
const act = (m: string, v: string) => `the ${m} ${PLURAL.has(m) ? v : v + (v.endsWith('x') ? 'es' : 's')}`
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function muscleGenerators(): ItemGenerator[] {
  return [
    G('bio.body.muscles.pair-action', 'bio.body.muscles', [2, 4], (rng, d) => {
      const p = rng.pick(PAIRS)
      const bend = rng.chance(0.5)
      const contracting = bend ? p.bendMuscle : p.straightenMuscle
      const relaxing = bend ? p.straightenMuscle : p.bendMuscle
      if (d <= 2) {
        return choice({
          rng,
          prompt: `${capFirst(act(contracting, 'contract'))}. What happens to the ${p.limb}?`,
          correct: bend ? `It bends at the ${p.joint}` : `It straightens at the ${p.joint}`,
          wrong: [
            { label: bend ? `It straightens at the ${p.joint}` : `It bends at the ${p.joint}`, misconception: 'antagonist-swap', feedback: `That is what happens when ${act(relaxing, 'contract')}.` },
            { label: 'Nothing, because muscles can only push', misconception: 'muscles-push', feedback: 'Muscles pull when they contract; they never push.' },
          ],
          hint: `The ${p.bendMuscle} and ${p.straightenMuscle} are an antagonistic pair at the ${p.joint}.`,
          explanation: `When ${act(p.bendMuscle, 'contract')}, the ${p.limb} bends at the ${p.joint}. When ${act(p.straightenMuscle, 'contract')}, it straightens.`,
        })
      }
      return choice({
        rng,
        prompt: `The ${p.limb} ${bend ? 'bends' : 'straightens'} at the ${p.joint}. What are the ${p.bendMuscle} and the ${p.straightenMuscle} doing?`,
        correct: `${capFirst(act(contracting, 'contract'))} and ${act(relaxing, 'relax')}`,
        wrong: [
          { label: `${capFirst(act(relaxing, 'contract'))} and ${act(contracting, 'relax')}`, misconception: 'antagonist-swap', feedback: `That would ${bend ? 'straighten' : 'bend'} the ${p.limb}.` },
          { label: 'Both contract at the same time', misconception: 'both-contract', feedback: 'If both pulled at once, the joint would not move freely. One contracts while the other relaxes.' },
          { label: 'Both relax at the same time', misconception: 'both-relax', feedback: 'A relaxed muscle cannot pull. One must contract to move the bone.' },
        ],
        hint: 'In an antagonistic pair, one contracts while the other relaxes.',
        explanation: `To ${bend ? 'bend' : 'straighten'} the ${p.limb}, ${act(contracting, 'contract')} while ${act(relaxing, 'relax')}. The contracting muscle shortens and pulls on the bone. They are an antagonistic pair.`,
      })
    }),
  ]
}

export const bodyGenerators: ItemGenerator[] = [...bankGenerators(skeleton), ...skeletonClassify, ...bankGenerators(muscles), ...jointClassify, ...muscleGenerators()]
