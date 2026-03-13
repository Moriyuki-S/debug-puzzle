# syntax=docker/dockerfile:1

# ---------------
# -- VARIABLES --
# ---------------

ARG PYTHON_VERSION=3.13
ARG APP_DIR=app


# -------------------
# -- BASE IMAGE  ----
# -------------------

FROM python:${PYTHON_VERSION}-slim-bookworm

WORKDIR /${APP_DIR}

COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
