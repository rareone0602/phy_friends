/*
 * The cast: every friend's owner, how the friend is written, and who knows whom (src/cast.js).
 *
 * name     The friend's name as its owner writes it.
 * pronoun  As the owner gave it; "they" until told.
 * species  Two or three lower-case words, as the friend's label on the gallery gives them.
 * credit   The owner's handle and page, as the gallery credits them.
 * agreed   The media the owner has agreed to: 'gallery', 'video', 'games'. Work in any other medium
 *          that shows the friend is a draft until the owner agrees.
 * voice    true only if the owner has given the friend lines; otherwise the friend speaks in marks.
 *
 * The gallery (index.html) repeats each name, species and credit by hand, and names the host;
 * `python3 tools/pf.py test` fails wherever the two disagree.
 *
 * know lists pairs of friends whose owners know each other in real life; everyone else is a
 * stranger to everyone but the host. optIn lists pairs whose owners have both agreed to touch or
 * rivalry. Add a pair only when phy says so.
 */
PhyFriends.cast.define({
  host: 'phy',
  friends: {
    howdi: {
      name: 'Howdi', pronoun: 'he', species: 'sky-blue wolf',
      credit: { handle: '@howdi1129', href: 'https://x.com/howdi1129' }, agreed: ['gallery'],
    },
    yuanyuan: {
      name: 'YuanYuan', pronoun: 'he', species: 'lavender-haired cat',
      credit: { handle: '@Milk_YuanYuan', href: 'https://x.com/Milk_YuanYuan' }, agreed: ['gallery'],
    },
    phy: {
      name: 'phy', pronoun: 'they', species: 'tuxedo eevee',
      credit: { handle: 'linkedin', href: 'https://www.linkedin.com/in/po-hung-yeh-6a8134116' }, agreed: ['gallery', 'video', 'games'], voice: true,
    },
    fruit: {
      name: 'Fruit', pronoun: 'he', species: 'navy-blue wolf',
      credit: { handle: 'fb/cheekullowo', href: 'https://www.facebook.com/cheekullowo/' }, agreed: ['gallery'],
    },
    yuda: {
      name: 'Yuda', pronoun: 'he', species: 'slate-blue wolf',
      credit: { handle: '@YuDa_Hay', href: 'https://x.com/YuDa_Hay' }, agreed: ['gallery'],
    },
    terry: {
      name: 'Terry', pronoun: 'he', species: 'yellow plush toy',
      credit: { handle: '@FreshSnails_x_6', href: 'https://x.com/FreshSnails_x_6' }, agreed: ['gallery'],
    },
    brian: {
      name: 'Brian', pronoun: 'he', species: 'cream fox',
      credit: { handle: 'fb/brian.ren.856964', href: 'https://www.facebook.com/brian.ren.856964/' }, agreed: ['gallery'],
    },
    mumuyou: {
      name: 'mumuyou', pronoun: 'he', species: 'white fox',
      credit: { handle: 'fb/MuMuYouo', href: 'https://www.facebook.com/MuMuYouo' }, agreed: ['gallery'],
    },
    kevin: {
      name: 'K3V1N', pronoun: 'he', species: 'ice-blue cat',
      credit: { handle: '@K3V1N_V01D', href: 'https://x.com/K3V1N_V01D' }, agreed: ['gallery'],
    },
    bardell: {
      name: 'BarDell', pronoun: 'he', species: 'maple syrup puppy',
      credit: { handle: 'bardell_kc', href: 'https://sites.google.com/view/bardell-kc' }, agreed: ['gallery'],
    },
    cowosus: {
      name: 'cowosus', pronoun: 'he', species: 'australian shepherd',
      credit: { handle: 'linktr.ee/cowosus', href: 'https://linktr.ee/cowosus' }, agreed: ['gallery'],
    },
    raze: {
      name: 'Raze', pronoun: 'he', species: 'dark-teal dragon',
      credit: { handle: 'fb/huang.alan.9279', href: 'https://www.facebook.com/huang.alan.9279/' }, agreed: ['gallery'],
    },
    tanyuan: {
      name: 'tanyuan', pronoun: 'he', species: 'tan dog',
      credit: { handle: '@tanyuan_UwU', href: 'https://x.com/tanyuan_UwU' }, agreed: ['gallery'],
    },
    alfie: {
      name: 'Alfie', pronoun: 'they', species: 'coral tabby cat',
      credit: { handle: '@alfiecat_djq', href: 'https://x.com/alfiecat_djq' }, agreed: ['gallery'],
    },
    teni: {
      name: 'Teni', pronoun: 'he', species: 'cyan-haired glaceon',
      credit: { handle: '@foxx_manome', href: 'https://x.com/foxx_manome' }, agreed: ['gallery'],
    },
    whitedeer: {
      name: 'WhiteDeer', pronoun: 'he', species: 'ocean deer',
      credit: { handle: 'fb/bai.lu.149190', href: 'https://www.facebook.com/bai.lu.149190/' }, agreed: ['gallery'],
    },
    jiaoyue: {
      name: 'jiaoyue', pronoun: 'he', species: 'lavender dog',
      credit: { handle: 'github/Louis0325', href: 'https://github.com/Louis0325' }, agreed: ['gallery'],
    },
    claude: {
      name: 'Claude', pronoun: 'it', species: 'language model',
      credit: { handle: '@AnthropicAI', href: 'https://x.com/AnthropicAI' }, agreed: ['gallery'],
    },
  },
  know: [['yuda', 'fruit']],
  optIn: [],
});
