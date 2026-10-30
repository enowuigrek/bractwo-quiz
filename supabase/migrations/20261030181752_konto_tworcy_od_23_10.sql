-- konto twórcy „w aplikacji od” 23.10 (wtedy aplikacja była gotowa), bo gry i quizy są starsze niż konta osobowe (30.10)
update konta set utworzono = '2026-10-23 12:00:00+02'
where id = '6ff2f9ab-bcc8-4df6-8e48-a185132ccf56' and utworzono > '2026-10-23';
