CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE exercise_category AS ENUM ('STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BALANCE');

CREATE TYPE muscle_group AS ENUM ('CHEST', 'BACK', 'LEGS', 'ARMS', 'SHOULDERS', 'CORE');

CREATE TYPE workout_status AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    category exercise_category NOT NULL,
    muscle_group muscle_group NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    notes VARCHAR(255),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status workout_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercise(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(workout_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_log(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_min INT NOT NULL,
    comments VARCHAR(255)
);