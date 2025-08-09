# Deployment of Cloud-Based Deep Learning Image Processing Pipelines for the Tyree Micro-CT Facility

## Overview

This project focuses on deploying cloud-based deep learning pipelines for advanced 3D materials imaging at the Tyree Micro-CT Facility. The work involves packaging, integrating, and deploying high-performance AI algorithms for tasks such as:

* Super-resolution by region of interest
* Domain transfer for dynamic imaging

These AI models are developed by the DeepMatter group and are proprietary, originating from published research articles. **Due to confidentiality agreements, the AI source code is not included in this repository.**

---

## Current Development Status

We have completed the packaging of core deep learning workflows into CLI tools and are currently:

* Integrating the CLI into a lightweight web UI
* Building and refining the backend API
* Developing the frontend for job submission and result display

---

## Project Scope

1. **Stage 1**: Package core DL algorithms into validated CLI workflows
2. **Stage 2**: Wrap CLI workflows into a web-accessible UI and deploy to server/cloud

---

## Features

* Cloud/server deployment with Docker
* Support for large 3D datasets (TIFF stacks, RAW formats)
* Secure data handling with basic access control
* Error logging, validation checks, and documentation

---

## Tech Stack

* **Languages**: Python (PyTorch/TensorFlow)
* **Backend**: Flask / FastAPI
* **Frontend**: HTML, CSS, JavaScript
* **Deployment**: Docker, Linux server (SSH), optional Kubernetes
* **Version Control**: Git

---

## Confidentiality Notice

The AI models and training code are proprietary and **will not be released publicly**. They are based on research from peer-reviewed publications and are used here under specific agreements with the project supervisors.

---

## Expected Outcomes

* Functional CLI-based DL workflow
* Web-based UI for job submission and preview
* Fully deployed cloud/server solution
* Setup guide and user manual

---

## Notes

Servers and GPU resources are provided by the Tyree Micro-CT Facility. Further enhancements will focus on performance optimization and additional imaging workflows.
