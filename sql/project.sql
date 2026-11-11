set role admins;

drop table if exists activity_rsvp;
drop table if exists activity;
drop table if exists member;
drop table if exists trip_invite;
drop table if exists trip;
drop table if exists profile;

create table if not exists profile (
                                       id uuid not null default UUIDV7(),
                                       cell_number varchar(20), -- CHANGED: now optional so an invitee can sign up without a phone number
                                       created_at timestamptz not null default now(),
                                       email varchar(255) not null unique,
                                        image varchar(255) not null,
                                       name varchar(255) not null,
                                       primary key (id)
);

create table if not exists trip (
                                    id uuid not null default UUIDV7(),
                                    owner_id uuid not null,
                                    created_at timestamptz not null default now(),
                                    description text,
                                    destination varchar(255),
                                    end_date date,
                                    image varchar(255),
                                    start_date date,
                                    title varchar(255) not null,
                                    primary key (id),
                                    foreign key (owner_id) references profile(id),
                                    check (end_date >= start_date)
);
create index on trip(owner_id);

create table if not exists trip_invite (
                                           id uuid not null default UUIDV7(),
                                           invited_by uuid not null,
                                           trip_id uuid not null,
                                           accepted_profile_id uuid, -- stays empty until the invitee signs up
                                           cell_number varchar(20),
                                           created_at timestamptz not null default now(),
                                           email varchar(255),
                                           expires_at timestamptz,
                                            name varchar(64) not null,
                                           status varchar(20) not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
                                           token varchar(64) not null unique,
                                           primary key (id),
                                           foreign key (trip_id) references trip(id) on delete cascade, -- ADDED cascade: deleting a trip deletes its invites
                                           foreign key (invited_by) references profile(id),
                                           foreign key (accepted_profile_id) references profile(id),
                                           check (email is not null or cell_number is not null) -- an invite needs at least one contact method
);
create index on trip_invite(trip_id);
create index on trip_invite(invited_by);
create index on trip_invite(email) where email is not null;
create index on trip_invite(cell_number) where cell_number is not null;

create table if not exists member (
                                           id uuid not null default UUIDV7(),
                                           invite_id uuid not null,
                                           trip_id uuid not null,
                                           adults integer not null default 1 check (adults >= 0),
                                           children integer not null default 0 check (children >= 0),
                                           going varchar(5) not null default 'maybe' check (going in ('yes', 'no', 'maybe')),
                                           role varchar(10) not null default 'member' check (role in ('owner', 'member')),
                                           primary key (id),
                                           unique (trip_id, invite_id), -- a person can only join a trip once
                                           foreign key (trip_id) references trip(id) on delete cascade,
                                           foreign key (invite_id) references trip_invite(id)
);
create index on member(invite_id);
create index on member(trip_id); -- the unique constraint already covers lookups by trip_id

-- ADDED
create table if not exists activity (
                                        id uuid not null default UUIDV7(),
                                        trip_id uuid not null,
                                        address varchar(255),
                                        cost numeric(10,2) not null default 0 check (cost >= 0),
                                        description text,
                                        end_datetime timestamptz,
                                        lat numeric(9,6) check (lat between -90 and 90),
                                        lng numeric(9,6) check (lng between -180 and 180),
                                        location varchar(255),
                                        mandatory boolean not null default false,
                                        name varchar(255) not null,
                                        notes text,
                                        start_datetime timestamptz,
                                        primary key (id),
                                        foreign key (trip_id) references trip(id) on delete cascade,
                                        check (end_datetime >= start_datetime)
);
create index on activity(trip_id);


create table if not exists activity_rsvp (
                                             id uuid not null default UUIDV7(),
                                             activity_id uuid not null,
                                             member_id uuid not null,
                                             adults integer not null default 1 check (adults >= 0),
                                             children integer not null default 0 check (children >= 0),
                                             going varchar(5) not null default 'maybe' check (going in ('yes', 'no', 'maybe')),
                                             primary key (id),
                                             unique (activity_id, member_id), -- one RSVP per member per activity
                                             foreign key (activity_id) references activity(id) on delete cascade,
                                             foreign key (member_id) references member(id) on delete cascade
);
create index on activity_rsvp(member_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO itinerary_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO itinerary_app;
