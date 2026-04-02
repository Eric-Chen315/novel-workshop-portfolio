export const GENDER_LABEL_MAP: Record<string, string> = {
  '秦刃': '男/他',
  '林桐': '男/他',
  '郑维': '男/他',
  '陆鸣远': '男/他',
  '方远': '男/他',
  '周翰': '男/他',
  '沈明哲': '男/他',
  '王建国': '男/他',
  '陈律师': '男/他',
  '林正阳': '男/他',
  '苏可': '女/她',
  '赵谦': '女/她',
  'M-0': 'AI/它',
  'M-0系统': 'AI/它',
};

export const GENDER_VALUE_MAP: Record<string, string> = {
  '秦刃': '男',
  '林桐': '男',
  '郑维': '男',
  '陆鸣远': '男',
  '方远': '男',
  '周翰': '男',
  '沈明哲': '男',
  '王建国': '男',
  '陈律师': '男',
  '林正阳': '男',
  '苏可': '女',
  '赵谦': '女',
  'M-0': '无性别',
  'M-0系统': '无性别',
};

export const CHARACTER_PRONOUN_RULES: Record<string, { expectedPronoun: string; wrongPronouns: string[]; genderLabel: string }> = {
  '秦刃': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '林桐': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '郑维': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '陆鸣远': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '方远': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '周翰': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '沈明哲': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '王建国': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '陈律师': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '林正阳': { expectedPronoun: '他', wrongPronouns: ['她', '它'], genderLabel: '男' },
  '苏可': { expectedPronoun: '她', wrongPronouns: ['他', '它'], genderLabel: '女' },
  '赵谦': { expectedPronoun: '她', wrongPronouns: ['他', '它'], genderLabel: '女' },
  'M-0': { expectedPronoun: '它', wrongPronouns: ['他', '她'], genderLabel: 'AI系统' },
  'M-0系统': { expectedPronoun: '它', wrongPronouns: ['他', '她'], genderLabel: 'AI系统' },
};

export function getGenderLabel(name: string): string {
  return GENDER_LABEL_MAP[name] || '';
}

export function getGenderValue(name: string): string {
  return GENDER_VALUE_MAP[name] || '';
}

export function getPronounRule(name: string) {
  return CHARACTER_PRONOUN_RULES[name];
}