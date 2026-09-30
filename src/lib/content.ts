/**
 * All site copy lives here. Every claim comes from the Japolic brief:
 * a high-performance file system, multiple servers, shared storage, S3,
 * AI and data-intensive workloads. No metrics, customers or benchmarks are invented.
 */

export const NAV_LINKS = [
  { label: 'Product', href: '#product', chapters: [2, 3] },
  { label: 'Technology', href: '#technology', chapters: [4] },
  { label: 'Use Cases', href: '#use-cases', chapters: [7] },
  { label: 'Developers', href: '#developers', chapters: [5, 6] },
  { label: 'Resources', href: '#resources', chapters: [9] },
]

export const HERO_SPECS = ['Shared storage', 'S3 compatible', 'AI ready', 'High performance']

export const WORKLOAD_NEEDS = [
  'Multiple servers',
  'Shared datasets',
  'Huge files',
  'AI pipelines',
  'Distributed compute',
  'Cloud storage',
]

export const PAINS = ['Latency', 'Complexity', 'Duplicated data', 'Slow access', 'Expensive local storage']

export const SOLUTION_PATH = [
  { label: 'Server 01', key: false },
  { label: 'Server 02', key: false },
  { label: 'Server 03', key: false },
  { label: 'Server 04', key: false },
  { label: 'Japolic', key: true, note: 'One data layer' },
  { label: 'Shared storage', key: false, note: 'Every server, same data' },
]

export const LAYERS = [
  {
    name: 'Compute',
    tag: 'Applications run here',
    text: 'Your servers and the applications on them. Multiple servers connect at once, each seeing the same files.',
  },
  {
    name: 'Japolic',
    tag: 'High-performance file system',
    text: 'The data layer between compute and storage. It gives every connected server access to data at speeds closer to a local disk.',
  },
  {
    name: 'Shared storage',
    tag: 'One dataset, every server',
    text: 'Where the data lives, shared across servers instead of copied onto each one. Frequently used data stays fast and accessible.',
  },
  {
    name: 'S3',
    tag: 'Lower-cost capacity',
    text: 'Japolic works with S3, so large volumes of data can sit on lower-cost storage while frequently used data stays fast.',
  },
]

export const FEATURES = [
  {
    name: 'Local-speed access',
    text: 'Read and write shared data at speeds closer to a local disk.',
  },
  {
    name: 'Shared storage',
    text: 'Multiple servers connect to the same storage: one dataset, visible everywhere.',
  },
  {
    name: 'S3 compatibility',
    text: 'Works with S3, so large volumes can live on lower-cost storage while frequently used data stays fast.',
  },
  {
    name: 'Multi-server architecture',
    text: 'Connect more servers to the same file system as your workloads grow.',
  },
  {
    name: 'AI and data-intensive workloads',
    text: 'Built for pipelines where many processes need the same large datasets.',
  },
  {
    name: 'Distributed workloads',
    text: 'Spread work across compute nodes without spreading your data across them.',
  },
]

export const AI_STAGES = [
  { name: 'Dataset', text: 'Large files live once, in shared storage.' },
  { name: 'Preprocessing', text: 'Compute nodes read the same source data.' },
  { name: 'Training', text: 'More nodes join. Data access has to keep up.' },
  { name: 'Inference', text: 'Many readers, one data layer.' },
  { name: 'Result', text: 'Outputs are written back to shared storage.' },
]

export const USE_CASES = [
  { name: 'AI / ML', text: 'Compute nodes work from the same datasets.', fx: 'Compute nodes activate' },
  {
    name: 'Data-intensive applications',
    text: 'Heavy read and write workloads, served by one high-performance file system.',
    fx: 'Data streams intensify',
  },
  {
    name: 'Engineering teams',
    text: 'Everyone works against the same data, not their own copies.',
    fx: 'One dataset, many readers',
  },
  {
    name: 'Distributed compute',
    text: 'Add servers, and they connect to the same data layer.',
    fx: 'More server nodes appear',
  },
  {
    name: 'Large datasets',
    text: 'Keep large volumes on lower-cost storage without losing fast access.',
    fx: 'Storage expands',
  },
  {
    name: 'Cloud + hybrid infrastructure',
    text: 'Shared storage and S3, connected through one data layer.',
    fx: 'S3 layer activates',
  },
]

export const FINAL_FACTS = [
  'High-performance file system',
  'Shared storage',
  'Multi-server',
  'S3 compatible',
  'AI workloads',
  'Data-intensive workloads',
]

export const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'The data layer', href: '#product' },
      { label: 'Architecture', href: '#technology' },
      { label: 'Capabilities', href: '#developers' },
    ],
  },
  {
    title: 'Technology',
    links: [
      { label: 'Shared storage', href: '#technology' },
      { label: 'S3 compatibility', href: '#developers' },
      { label: 'AI workloads', href: '#ai' },
    ],
  },
  {
    title: 'Use cases',
    links: [
      { label: 'AI / ML', href: '#use-cases' },
      { label: 'Distributed compute', href: '#use-cases' },
      { label: 'Large datasets', href: '#use-cases' },
    ],
  },
  {
    title: 'Contact',
    links: [{ label: 'Talk to the team', href: 'mailto:hello@japolic.com' }],
  },
]

export const RAIL_LABELS = [
  'Overview',
  'The problem',
  'The reveal',
  'The data layer',
  'Architecture',
  'Capabilities',
  'AI workloads',
  'Use cases',
  'System',
]
