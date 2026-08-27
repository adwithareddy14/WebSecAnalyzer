from setuptools import setup, find_packages

setup(
    name="webvulnx",
    version="2.0.0",
    description="WebVulnX CLI — Ethical Web Security Assessment & Vulnerability Management Platform",
    packages=find_packages(),
    install_requires=[
        "click>=8.1.0",
        "rich>=13.7.0",
        "httpx>=0.27.0",
        "pydantic>=2.6.0"
    ],
    entry_points={
        "console_scripts": [
            "webvulnx=websecanalyzer_cli.main:cli",
            "websecanalyzer=websecanalyzer_cli.main:cli",
        ],
    },
)
