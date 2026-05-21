insert into themes (slug, name, name_tr, script_format, language) values
  ('immigrants', 'Immigrant Life', 'Göçmen Hayatı', 'A formal welcome orientation packet from the Bureau of Cultural Adjustment - dry bureaucratic tone that becomes increasingly absurd with each policy listed.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('muslims', 'Muslim Abroad', 'Yurt Dışında Müslüman', 'A highly panicked urgent WhatsApp message posted to the Family Group Chat - starts with a minor concern and spirals into full chaos.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('suburb', 'Suburb Life', 'Banliyö Hayatı', 'An official passive-aggressive HOA Violation Letter that escalates into a full Nextdoor/Facebook Neighborhood Group post thread.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('fathers-day', 'Father''s Day', 'Babalar Günü', 'An incredibly emotional father-to-child speech at a major milestone - sentimental tone that keeps getting derailed by the most absurd advice.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('corporate', 'Corporate World', 'Kurumsal Dünya', 'A company-wide leaked Reply-All email chain that starts professional and dissolves into complete chaos, ending with an HR memo.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('general', 'General Audience', 'Genel Seyirci', 'A dramatic True Crime podcast cold open treating a completely minor everyday incident as a full unsolved mystery.', 'en')
on conflict (slug) do nothing;

insert into themes (slug, name, name_tr, script_format, language) values
  ('turkish-immigrants', 'Turkish Immigrants', 'Türk Göçmenler', 'Bir konsolosluk sirasi diyalogu ya da memleketten gelen bir akrabanin yazdigi sitem dolu WhatsApp mesaji - asiri ciddi baslayip giderek absurd bir hal aliyor.', 'tr')
on conflict (slug) do nothing;

delete from questions where theme_id in (select id from themes);

insert into questions (theme_id, order_num, text) select id, 1, 'What is a completely useless rule your neighborhood or landlord enforces?' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 2, 'What is the most unnecessary lawn ornament or decoration you have ever seen?' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 3, 'What is the pettiest reason you or a neighbor have ever gotten into an argument?' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 4, 'Name an item you would be embarrassed to leave in your driveway for 24 hours.' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 5, 'What is a weird specific noise you hear outside your house at 2:00 AM?' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 6, 'What is the ultimate suburban flex? (e.g. a specific lawnmower, a massive grill)' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 7, 'Complete the phrase: You know you are in the suburbs when you see a ___.' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 8, 'What is the worst advice you could give someone trying to fit into a new neighborhood?' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 9, 'Name a minor chore that feels like an absolute punishment.' from themes where slug='suburb';
insert into questions (theme_id, order_num, text) select id, 10, 'What is a fake name for a neighborhood watch captain who takes their job way too seriously?' from themes where slug='suburb';

insert into questions (theme_id, order_num, text) select id, 1, 'What is the most awkward place you have ever had to find a corner to pray in public?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 2, 'What is the closest you have come to accidentally eating pork, and how did you realize?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 3, 'What is a question a non-Muslim coworker asked you about Ramadan that left you speechless?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 4, 'What is a highly specific item your parents brought in their suitcase from back home to survive abroad?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 5, 'What is a major red flag when looking for a potential spouse on a Muslim dating app?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 6, 'Name a food item that should be halal but the ingredient list made you suspicious.' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 7, 'What is a classic guilt-trip phrase your parents use when you do not call them enough?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 8, 'What is the hardest Islamic concept or tradition to explain to a child raised in the West?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 9, 'What is a cultural superstition your family treats as if it is a strict religious rule?' from themes where slug='muslims';
insert into questions (theme_id, order_num, text) select id, 10, 'What is the ultimate Aunty behavior you have witnessed at a community event?' from themes where slug='muslims';

insert into questions (theme_id, order_num, text) select id, 1, 'What is the absolute worst piece of advice your father ever gave you with total confidence?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 2, 'What is an incredibly specific object that a dad will refuse to throw away no matter how broken it is?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 3, 'What is a phrase your dad says when he is trying to fix something but clearly has no idea what he is doing?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 4, 'What is the most boring topic a dad can talk about for three hours straight?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 5, 'What is the ultimate Dad outfit item that should be banned by law?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 6, 'What is something a dad will do just to save exactly two dollars?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 7, 'What is a weird habit dads have while driving long distance?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 8, 'What is the most disappointing gift you could possibly give a father?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 9, 'What is a sound a dad makes when he sits down on the couch after a long day?' from themes where slug='fathers-day';
insert into questions (theme_id, order_num, text) select id, 10, 'Complete the sentence: A real man always knows how to ___.' from themes where slug='fathers-day';

insert into questions (theme_id, order_num, text) select id, 1, 'What is the most baffling English idiom you heard when you first arrived that made no literal sense?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 2, 'What is a common local custom or habit that you still find completely bizarre?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 3, 'What is the weirdest thing you have seen someone do at an airport baggage claim?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 4, 'What is a word from your native language that cannot be translated into English without a 10-minute explanation?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 5, 'What is an everyday object back home that you simply cannot find here?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 6, 'What is the funniest way a local has completely mispronounced your name or a friend''s name?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 7, 'What is something you did to try and blend in when you first arrived that totally backfired?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 8, 'What is a food combination from this country that you think is an absolute crime against humanity?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 9, 'What is the most stressful part about dealing with any government office or paperwork here?' from themes where slug='immigrants';
insert into questions (theme_id, order_num, text) select id, 10, 'If you could sum up the American Dream in just one object, what would it be?' from themes where slug='immigrants';

insert into questions (theme_id, order_num, text) select id, 1, 'What is a piece of corporate jargon or buzzword that makes you want to scream? (e.g. synergy, circle back)' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 2, 'What is the most useless item you have ever received in a company swag bag?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 3, 'What is a completely valid reason to turn your camera off during a Zoom or Teams meeting?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 4, 'What is the unwritten, unspoken rule of the office breakroom or communal fridge?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 5, 'What is a fake, professional-sounding excuse for being 10 minutes late to a meeting?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 6, 'What is an activity you would rather do than attend a mandatory team-building event?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 7, 'What is a passive-aggressive sign-off to an email instead of Best regards?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 8, 'If your company''s mission statement was completely honest, what would it say?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 9, 'What is the most minor accomplishment you have seen someone celebrate like they won a Nobel Prize?' from themes where slug='corporate';
insert into questions (theme_id, order_num, text) select id, 10, 'What is a job title that sounds incredibly fancy but means absolutely nothing?' from themes where slug='corporate';

insert into questions (theme_id, order_num, text) select id, 1, 'Buraya ilk geldiğinizde markette görüp "Bu ne saçma şey" dediğiniz ilk ürün neydi?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 2, 'Amerikalıların anlayamadığı, açıklamaktan yorulduğunuz Türk adeti nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 3, 'Türkiye den bavulla getirirken gümrükte yakalanma korkusu yaşadığınız en garip yiyecek veya eşya neydi?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 4, 'Bir Amerikalının adınızı en yaratıcı şekilde yanlış telaffuz etme anısı nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 5, 'Gurbette yaşayıp da asla özlemediğiniz, "İyi ki orda kalmış" dediğiniz şey nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 6, 'Buradaki Türk topluluğunda karşılaştığınız en tipik klasik hemşehri davranışı nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 7, 'Evinize gelen bir yabancı misafirin gördüğünde şok olduğu ev eşyası nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 8, 'Türkiye deki akrabaların "Siz orada kesin ___ yapıyorsunuzdur" diye düşündüğü en büyük yanlış anlama nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 9, 'Buranın kültürüne ayak uydurmaya çalışırken yaptığınız en büyük pot veya cam devirme anısı nedir?' from themes where slug='turkish-immigrants';
insert into questions (theme_id, order_num, text) select id, 10, 'Türk kahvesi veya çay bulamadığınızda yerine koymaya çalıştığınız en başarısız alternatif neydi?' from themes where slug='turkish-immigrants';

insert into questions (theme_id, order_num, text) select id, 1, 'What is a minor daily inconvenience that absolutely ruins your entire mood?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 2, 'What is the most useless talent or party trick you possess?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 3, 'What is a lie you told as a child that your parents still believe to this day?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 4, 'What is something people think makes them look cool but actually makes them look ridiculous?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 5, 'If you could ban one specific fashion trend forever, what would it be?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 6, 'What is the weirdest thing you bought online late at night that you instantly regretted when it arrived?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 7, 'What is a food that you absolutely hate but everyone else seems to love?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 8, 'What is the worst text message you could accidentally send to the wrong person?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 9, 'What is a fictional creature or movie character you are secretly convinced actually exists?' from themes where slug='general';
insert into questions (theme_id, order_num, text) select id, 10, 'Complete the phrase: You should never trust a person who ___.' from themes where slug='general';
