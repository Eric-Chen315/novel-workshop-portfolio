export type CharacterRow = {
  id: string;
  name: string;
  ageAppearance: string;
  background: string;
  personality: string;
  speakingStyle: string;
  catchphrase: string;
  currentLocation: string;
  currentStatus: string;
  defaultInject: 0 | 1;
  locked: 0 | 1;
  createdAt: string;
  updatedAt: string;
};

export type SettingRow = {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PlotlineRow = {
  id: string;
  name: string;
  rule: string;
  trigger: string;
  status: "untriggered" | "triggered";
  createdAt: string;
  updatedAt: string;
};

export type DeprecatedRow = {
  id: string;
  name: string;
  content: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};
